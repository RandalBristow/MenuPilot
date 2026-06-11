import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  normalizeBusinessPricingSettings,
  type BusinessPricingSettings,
  type RawBusinessPricingSettings,
} from "@/lib/pricing/business-pricing-settings"

export async function getBusinessPricingSettings(
  businessId: string
): Promise<BusinessPricingSettings> {
  const { data, error } = await supabaseAdmin
    .from("business_pricing_settings")
    .select(
      `
      pizza_half_topping_pricing_enabled,
      pizza_half_topping_included_weight_enabled,
      pizza_half_topping_rounding_mode,
      sales_tax_rate_percent,
      service_fee_type,
      service_fee_value,
      tips_enabled
    `
    )
    .eq("business_id", businessId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load pricing settings: ${error.message}`)
  }

  return normalizeBusinessPricingSettings(data as RawBusinessPricingSettings | null)
}
