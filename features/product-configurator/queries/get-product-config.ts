import { supabase } from "@/lib/supabase/client"
import { applyEffectiveModifierGroups } from "@/features/product-configurator/utils/apply-effective-modifier-groups"
import { applyEffectiveVariants } from "@/features/product-configurator/utils/apply-effective-product-variants"

export async function getProductConfig(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      builder_template,
      has_variants,
      is_enabled,
      base_price,
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
      ),
      product_variant_modifier_option_availability_rules (
        product_id,
        variant_group_option_id,
        modifier_group_id,
        modifier_option_id,
        is_available,
        is_enabled
      ),
      product_modifier_option_overrides (
        modifier_option_id,
        price_delta_override,
        prep_time_delta_minutes_override,
        is_enabled,
        sort_order
      ),
      product_modifier_groups (
        id,
        is_enabled,
        sort_order,
        modifier_groups (
          id,
          name,
          selection_type,
          is_required,
          min_required,
          max_allowed,
          is_enabled,
          supports_placement,
          supports_multiplier,
          min_multiplier,
          max_multiplier,
          multiplier_step,
          modifier_options (
            id,
            name,
            price_delta,
            is_enabled,
            sort_order,
            modifier_option_group_id,
            modifier_option_groups (
              id,
              name,
              description,
              is_enabled,
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
      ),
      product_default_modifier_options (
        id,
        modifier_group_id,
        modifier_option_id,
        placement,
        multiplier,
        quantity,
        is_enabled,
        sort_order
      )
    `)
    .eq("id", productId)
    .eq("is_enabled", true)
    .single()

  if (error) {
    throw new Error(`Failed to load product config: ${error.message}`)
  }

  return applyEffectiveModifierGroups(applyEffectiveVariants(data))
}
