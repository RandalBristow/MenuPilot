import { describe, expect, it } from "vitest"
import {
  buildVariantModifierAvailabilityRulePayload,
  buildVariantModifierPriceOverridePayload,
  isModifierOptionAvailableForVariant,
} from "./variant-modifier-availability"

describe("variant modifier availability helpers", () => {
  it("treats missing rules as available", () => {
    expect(
      isModifierOptionAvailableForVariant({
        selectedVariantOptionId: "size-12",
        modifierGroupId: "crust",
        modifierOptionId: "gluten-free",
        availabilityRules: [],
      })
    ).toBe(true)
  })

  it("displays enabled unavailable rules as unavailable", () => {
    expect(
      isModifierOptionAvailableForVariant({
        selectedVariantOptionId: "size-12",
        modifierGroupId: "crust",
        modifierOptionId: "gluten-free",
        availabilityRules: [
          {
            id: "rule-1",
            variant_group_option_id: "size-12",
            modifier_group_id: "crust",
            modifier_option_id: "gluten-free",
            is_available: false,
            is_enabled: true,
          },
        ],
      })
    ).toBe(false)
  })

  it("ignores disabled rules", () => {
    expect(
      isModifierOptionAvailableForVariant({
        selectedVariantOptionId: "size-12",
        modifierGroupId: "crust",
        modifierOptionId: "gluten-free",
        availabilityRules: [
          {
            id: "rule-1",
            variant_group_option_id: "size-12",
            modifier_group_id: "crust",
            modifier_option_id: "gluten-free",
            is_available: false,
            is_enabled: false,
          },
        ],
      })
    ).toBe(true)
  })

  it("builds unavailable rule payloads for toggles", () => {
    expect(
      buildVariantModifierAvailabilityRulePayload({
        businessId: "business-1",
        productId: "product-1",
        variantGroupOptionId: "size-12",
        modifierGroupId: "crust",
        modifierOptionId: "gluten-free",
      })
    ).toEqual({
      business_id: "business-1",
      product_id: "product-1",
      variant_group_option_id: "size-12",
      modifier_group_id: "crust",
      modifier_option_id: "gluten-free",
      is_available: false,
      is_enabled: true,
    })
  })

  it("builds variant-specific modifier price override payloads", () => {
    expect(
      buildVariantModifierPriceOverridePayload({
        businessId: "business-1",
        productId: "product-1",
        variantGroupOptionId: "size-16",
        modifierGroupId: "toppings",
        modifierOptionId: "pepperoni",
        priceDelta: 2.5,
      })
    ).toEqual({
      business_id: "business-1",
      product_id: "product-1",
      variant_group_option_id: "size-16",
      modifier_group_id: "toppings",
      modifier_option_id: "pepperoni",
      price_delta: 2.5,
      is_enabled: true,
    })
  })
})
