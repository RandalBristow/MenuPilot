import { supabase } from "@/lib/supabase/client"
import {
  applyEffectiveVariants,
  type ProductWithVariantSources,
} from "@/features/product-configurator/utils/apply-effective-product-variants"
import { loadActivePublicSpecials } from "@/features/specials/queries/load-active-public-specials"

type ProductGroupWithProduct = {
  products: ProductWithVariantSources | ProductWithVariantSources[] | null
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
  product: ProductWithVariantSources | null,
  businessId: string
) {
  if (!product) return false

  const scopedProduct = product as ProductWithBusinessScope

  return !scopedProduct.business_id || scopedProduct.business_id === businessId
}

function isNonNull<T>(value: T | null): value is T {
  return value !== null
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

  const activeSpecials = await loadActivePublicSpecials({
    businessId: business.id,
    currentTime: new Date(),
    timeZone: locations?.[0]?.timezone ?? "America/New_York",
  })

  return {
    business: business as MenuBusiness,
    activeSpecials,
    menus: (menus ?? [])
      .map((menu) => applyMenuBusinessScope(menu, business.id))
      .map(applyEffectiveVariantsToMenu),
  }
}
