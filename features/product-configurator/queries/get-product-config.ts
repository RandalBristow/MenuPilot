import { supabase } from "@/lib/supabase/client"

export async function getProductConfig(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      builder_template,
      has_variants,
      base_price,
      product_variants (
        id,
        name,
        base_price,
        is_default,
        sort_order
      ),
      product_modifier_groups (
        id,
        sort_order,
        modifier_groups (
          id,
          name,
          selection_type,
          is_required,
          min_required,
          max_allowed,
          supports_placement,
          supports_multiplier,
          min_multiplier,
          max_multiplier,
          multiplier_step,
          modifier_options (
            id,
            name,
            price_delta,
            sort_order,
            modifier_option_group_id,
            modifier_option_groups (
              id,
              name,
              description,
              sort_order
            )
          )
        )
      ),
      product_included_modifier_groups (
        id,
        modifier_group_id,
        included_quantity,
        is_swappable,
        charge_for_extra
      )
    `)
    .eq("id", productId)
    .single()

  if (error) {
    throw new Error(`Failed to load product config: ${error.message}`)
  }

  return data
}