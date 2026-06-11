import { supabase } from "@/lib/supabase/client"
import {
  applyEffectiveVariants,
  type ProductWithVariantSources,
} from "@/features/product-configurator/utils/apply-effective-product-variants"
import { loadActivePublicSpecials } from "@/features/specials/queries/load-active-public-specials"
import {
  groupProductOperationalAvailabilityRecords,
  resolveOperationalAvailabilityForRecords,
  type RawOperationalAvailabilityRecord,
} from "@/features/availability/utils/operational-availability-records"
import type { OperationalAvailabilityOverride } from "@/features/availability/types/operational-availability"

type ProductGroupWithProduct = {
  products: ProductWithBusinessScope | ProductWithBusinessScope[] | null
}

type MenuWithProductGroups = {
  menu_groups?: {
    product_groups?: ProductGroupWithProduct[] | null
  }[] | null
}

type MenuBusiness = {
  id: string
  name: string
  slug: string
  status: string | null
}

type ProductWithBusinessScope = ProductWithVariantSources & {
  id: string
  is_enabled: boolean
  business_id?: string | null
  media_assets?:
    | {
        business_id?: string | null
      }
    | {
        business_id?: string | null
      }[]
    | null
}

function clearCrossTenantMedia<T extends ProductWithBusinessScope>(
  product: T,
  businessId: string
) {
  const mediaAssets = product.media_assets

  if (!mediaAssets) return product

  if (Array.isArray(mediaAssets)) {
    return {
      ...product,
      media_assets: mediaAssets.filter(
        (asset) => !asset.business_id || asset.business_id === businessId
      ),
    }
  }

  if (mediaAssets.business_id && mediaAssets.business_id !== businessId) {
    return {
      ...product,
      media_assets: null,
    }
  }

  return product
}

function productBelongsToBusiness(
  product: ProductWithBusinessScope | null,
  businessId: string
) {
  if (!product) return false

  const scopedProduct = product as ProductWithBusinessScope

  return !scopedProduct.business_id || scopedProduct.business_id === businessId
}

function isNonNull<T>(value: T | null): value is T {
  return value !== null
}

function collectMenuProductIds(menu: MenuWithProductGroups) {
  return [
    ...new Set(
      (menu.menu_groups ?? []).flatMap((menuGroup) =>
        (menuGroup.product_groups ?? []).flatMap((productGroup) => {
          const products = productGroup.products

          if (Array.isArray(products)) {
            return products.map((product) => product.id)
          }

          return products ? [products.id] : []
        })
      )
    ),
  ]
}

export function applyMenuOperationalAvailability<T extends MenuWithProductGroups>({
  menu,
  productAvailabilityRecords,
  currentTime,
}: {
  menu: T
  productAvailabilityRecords: Map<string, OperationalAvailabilityOverride[]>
  currentTime: Date
}) {
  return {
    ...menu,
    menu_groups: (menu.menu_groups ?? []).map((menuGroup) => ({
      ...menuGroup,
      product_groups: (menuGroup.product_groups ?? [])
        .map((productGroup) => {
          const products = productGroup.products

          if (Array.isArray(products)) {
            const availableProducts = products.filter((product) =>
              resolveOperationalAvailabilityForRecords({
                isPermanentlyEnabled: product.is_enabled,
                records: productAvailabilityRecords.get(product.id),
                currentTime,
              }).isOperationallyAvailable
            )

            return {
              ...productGroup,
              products: availableProducts,
            }
          }

          if (!products) return productGroup

          const availability = resolveOperationalAvailabilityForRecords({
            isPermanentlyEnabled: products.is_enabled,
            records: productAvailabilityRecords.get(products.id),
            currentTime,
          })

          if (!availability.isOperationallyAvailable) return null

          return productGroup
        })
        .filter(isNonNull),
    })),
  }
}

export function applyMenuBusinessScope<T extends MenuWithProductGroups>(
  menu: T,
  businessId: string
) {
  return {
    ...menu,
    menu_groups: (menu.menu_groups ?? []).map((menuGroup) => ({
      ...menuGroup,
      product_groups: (menuGroup.product_groups ?? [])
        .map((productGroup) => {
          const products = productGroup.products

          if (Array.isArray(products)) {
            const scopedProducts = products
              .filter((product) => productBelongsToBusiness(product, businessId))
              .map((product) => clearCrossTenantMedia(product, businessId))

            return {
              ...productGroup,
              products: scopedProducts,
            }
          }

          if (!productBelongsToBusiness(products, businessId)) return null

          return {
            ...productGroup,
            products: products
              ? clearCrossTenantMedia(products, businessId)
              : products,
          }
        })
        .filter(isNonNull),
    })),
  }
}

function applyEffectiveVariantsToMenu<T extends MenuWithProductGroups>(menu: T) {
  return {
    ...menu,
    menu_groups: (menu.menu_groups ?? []).map((menuGroup) => ({
      ...menuGroup,
      product_groups: (menuGroup.product_groups ?? []).map((productGroup) => {
        const products = productGroup.products

        if (Array.isArray(products)) {
          return {
            ...productGroup,
            products: products.map(applyEffectiveVariants),
          }
        }

        return {
          ...productGroup,
          products: products ? applyEffectiveVariants(products) : products,
        }
      }),
    })),
  }
}

export function isSetupBusiness(business: Pick<MenuBusiness, "status">) {
  return business.status === "setup"
}

export async function getMenuByBusinessSlug(businessSlug: string) {
  const currentTime = new Date()
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug, status")
    .eq("slug", businessSlug)
    .single()

  if (businessError) {
    throw new Error(`Failed to load business: ${businessError.message}`)
  }

  const { data: menus, error: menuError } = await supabase
    .from("menus")
    .select(
      `
      id,
      name,
      description,
      menu_groups (
        id,
        name,
        slug,
        description,
        parent_group_id,
        sort_order,
        display_style,
        product_groups (
          id,
          sort_order,
          products (
            id,
            business_id,
            name,
            slug,
            description,
            base_price,
            builder_template,
            has_variants,
            is_featured,
            is_enabled,
            image_media_id,
            media_assets (
              id,
              business_id,
              public_url,
              alt_text,
              caption,
              is_archived
            ),
            product_variant_groups (
              id,
              is_enabled,
              sort_order,
              variant_groups (
                id,
                variant_group_options (
                  id,
                  name,
                  base_price,
                  is_default,
                  is_enabled,
                  sort_order
                )
              )
            ),
            product_variant_option_overrides (
              variant_group_option_id,
              price_override,
              is_enabled,
              is_default,
              sort_order
            )
          )
        )
      )
    `
    )
    .eq("business_id", business.id)
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true })

  if (menuError) {
    throw new Error(`Failed to load menu: ${menuError.message}`)
  }

  const { data: locations, error: locationError } = await supabase
    .from("locations")
    .select("timezone")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })
    .limit(1)

  if (locationError) {
    throw new Error(`Failed to load menu location: ${locationError.message}`)
  }

  const scopedMenus = (menus ?? []).map((menu) =>
    applyMenuBusinessScope(menu, business.id)
  )
  const productIds = scopedMenus.flatMap(collectMenuProductIds)
  const { data: productAvailability, error: availabilityError } =
    productIds.length > 0
      ? await supabase
          .from("product_operational_availability")
          .select("id, product_id, location_id, is_86d, reason, expires_at")
          .eq("business_id", business.id)
          .in("product_id", productIds)
      : { data: [], error: null }

  if (availabilityError) {
    throw new Error(
      `Failed to load product availability: ${availabilityError.message}`
    )
  }

  const productAvailabilityRecords = groupProductOperationalAvailabilityRecords(
    productAvailability as RawOperationalAvailabilityRecord[]
  )

  const activeSpecials = await loadActivePublicSpecials({
    businessId: business.id,
    currentTime,
    timeZone: locations?.[0]?.timezone ?? "America/New_York",
  })

  return {
    business: business as MenuBusiness,
    activeSpecials,
    menus: scopedMenus
      .map((menu) =>
        applyMenuOperationalAvailability({
          menu,
          productAvailabilityRecords,
          currentTime,
        })
      )
      .map(applyEffectiveVariantsToMenu),
  }
}
