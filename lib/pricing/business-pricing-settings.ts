export type PizzaHalfToppingRoundingMode = "floor_to_cent"
export type ServiceFeeType = "none" | "fixed" | "percentage"

export type BusinessPricingSettings = {
  pizzaHalfToppingPricingEnabled: boolean
  pizzaHalfToppingIncludedWeightEnabled: boolean
  pizzaHalfToppingRoundingMode: PizzaHalfToppingRoundingMode
  salesTaxRatePercent: number
  serviceFeeType: ServiceFeeType
  serviceFeeValue: number
  tipsEnabled: boolean
}

export type RawBusinessPricingSettings = {
  pizza_half_topping_pricing_enabled?: boolean | null
  pizza_half_topping_included_weight_enabled?: boolean | null
  pizza_half_topping_rounding_mode?: string | null
  sales_tax_rate_percent?: number | string | null
  service_fee_type?: string | null
  service_fee_value?: number | string | null
  tips_enabled?: boolean | null
}

export const DEFAULT_BUSINESS_PRICING_SETTINGS: BusinessPricingSettings = {
  pizzaHalfToppingPricingEnabled: true,
  pizzaHalfToppingIncludedWeightEnabled: true,
  pizzaHalfToppingRoundingMode: "floor_to_cent",
  salesTaxRatePercent: 0,
  serviceFeeType: "none",
  serviceFeeValue: 0,
  tipsEnabled: false,
}

function toNonnegativeNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue >= 0
    ? numberValue
    : fallback
}

function normalizeServiceFeeType(value: unknown): ServiceFeeType {
  return value === "fixed" || value === "percentage" ? value : "none"
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
  const serviceFeeType =
    camelSettings.serviceFeeType ?? rawSettings.service_fee_type

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
    salesTaxRatePercent: toNonnegativeNumber(
      camelSettings.salesTaxRatePercent ?? rawSettings.sales_tax_rate_percent,
      DEFAULT_BUSINESS_PRICING_SETTINGS.salesTaxRatePercent
    ),
    serviceFeeType: normalizeServiceFeeType(serviceFeeType),
    serviceFeeValue: toNonnegativeNumber(
      camelSettings.serviceFeeValue ?? rawSettings.service_fee_value,
      DEFAULT_BUSINESS_PRICING_SETTINGS.serviceFeeValue
    ),
    tipsEnabled:
      camelSettings.tipsEnabled ??
      rawSettings.tips_enabled ??
      DEFAULT_BUSINESS_PRICING_SETTINGS.tipsEnabled,
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
    sales_tax_rate_percent: settings.salesTaxRatePercent,
    service_fee_type: settings.serviceFeeType,
    service_fee_value:
      settings.serviceFeeType === "none" ? 0 : settings.serviceFeeValue,
    tips_enabled: settings.tipsEnabled,
  }
}
