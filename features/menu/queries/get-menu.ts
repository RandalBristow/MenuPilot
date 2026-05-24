import { supabase } from "@/lib/supabase/client"
import {
  applyEffectiveVariants,
  type ProductWithVariantSources,
} from "@/features/product-configurator/utils/apply-effective-product-variants"

type ProductGroupWithProduct = {
  products: ProductWithVariantSources | ProductWithVariantSources[] | null
}

type MenuWithProductGroups = {
  menu_groups?: {
    product_groups?: ProductGroupWithProduct[] | null
  }[] | null
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

export async function getMenuByBusinessSlug(businessSlug: string) {
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug")
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

  return {
    business,
    menus: (menus ?? []).map(applyEffectiveVariantsToMenu),
  }
}
