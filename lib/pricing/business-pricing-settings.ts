export type PizzaHalfToppingRoundingMode = "floor_to_cent"

export type BusinessPricingSettings = {
  pizzaHalfToppingPricingEnabled: boolean
  pizzaHalfToppingIncludedWeightEnabled: boolean
  pizzaHalfToppingRoundingMode: PizzaHalfToppingRoundingMode
}

export type RawBusinessPricingSettings = {
  pizza_half_topping_pricing_enabled?: boolean | null
  pizza_half_topping_included_weight_enabled?: boolean | null
  pizza_half_topping_rounding_mode?: string | null
}

export const DEFAULT_BUSINESS_PRICING_SETTINGS: BusinessPricingSettings = {
  pizzaHalfToppingPricingEnabled: true,
  pizzaHalfToppingIncludedWeightEnabled: true,
  pizzaHalfToppingRoundingMode: "floor_to_cent",
}

export function normalizeBusinessPricingSettings(
  settings?: RawBusinessPricingSettings | BusinessPricingSettings | null
): BusinessPricingSettings {
  if (!settings) return DEFAULT_BUSINESS_PRICING_SETTINGS

  const camelSettings = settings as Partial<BusinessPricingSettings>
  const rawSettings = settings as RawBusinessPricingSettings
  const roundingMode =
    camelSettings.pizzaHalfToppingRoundingMode ??
    rawSettings.pizza_half_topping_rounding_mode

  return {
    pizzaHalfToppingPricingEnabled:
      camelSettings.pizzaHalfToppingPricingEnabled ??
      rawSettings.pizza_half_topping_pricing_enabled ??
      DEFAULT_BUSINESS_PRICING_SETTINGS.pizzaHalfToppingPricingEnabled,
    pizzaHalfToppingIncludedWeightEnabled:
      camelSettings.pizzaHalfToppingIncludedWeightEnabled ??
      rawSettings.pizza_half_topping_included_weight_enabled ??
      DEFAULT_BUSINESS_PRICING_SETTINGS.pizzaHalfToppingIncludedWeightEnabled,
    pizzaHalfToppingRoundingMode:
      roundingMode === "floor_to_cent"
        ? roundingMode
        : DEFAULT_BUSINESS_PRICING_SETTINGS.pizzaHalfToppingRoundingMode,
  }
}

export function mapBusinessPricingSettingsToRow(
  settings: BusinessPricingSettings
) {
  return {
    pizza_half_topping_pricing_enabled:
      settings.pizzaHalfToppingPricingEnabled,
    pizza_half_topping_included_weight_enabled:
      settings.pizzaHalfToppingIncludedWeightEnabled,
    pizza_half_topping_rounding_mode:
      settings.pizzaHalfToppingRoundingMode,
  }
}
