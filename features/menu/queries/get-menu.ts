import { supabase } from "@/lib/supabase/client"

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
            product_variants (
              id,
              name,
              base_price,
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
    menus,
  }
}