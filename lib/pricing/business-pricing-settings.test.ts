import { describe, expect, it } from "vitest"
import {
  DEFAULT_BUSINESS_PRICING_SETTINGS,
  normalizeBusinessPricingSettings,
} from "./business-pricing-settings"

describe("normalizeBusinessPricingSettings", () => {
  it("uses pizza half topping defaults when a business has no settings row", () => {
    expect(normalizeBusinessPricingSettings(null)).toEqual(
      DEFAULT_BUSINESS_PRICING_SETTINGS
    )
  })

  it("maps database row settings to pricing settings", () => {
    expect(
      normalizeBusinessPricingSettings({
        pizza_half_topping_pricing_enabled: false,
        pizza_half_topping_included_weight_enabled: true,
        pizza_half_topping_rounding_mode: "floor_to_cent",
      })
    ).toEqual({
      pizzaHalfToppingPricingEnabled: false,
      pizzaHalfToppingIncludedWeightEnabled: true,
      pizzaHalfToppingRoundingMode: "floor_to_cent",
    })
  })

  it("falls back to floor-to-cent for unknown rounding modes", () => {
    expect(
      normalizeBusinessPricingSettings({
        pizza_half_topping_rounding_mode: "round_to_cent",
      }).pizzaHalfToppingRoundingMode
    ).toBe("floor_to_cent")
  })
})
