import { describe, expect, it } from "vitest"
import {
  applyVariantModifierOptionPrices,
  resolveVariantModifierOptionPrice,
} from "./variant-modifier-pricing"

const priceOverrides = [
  {
    variant_group_option_id: "size-10",
    modifier_group_id: "toppings",
    modifier_option_id: "pepperoni",
    price_delta: 1,
    is_enabled: true,
  },
  {
    variant_group_option_id: "size-16",
    modifier_group_id: "toppings",
    modifier_option_id: "pepperoni",
    price_delta: "2.50",
    is_enabled: true,
  },
]

describe("variant modifier pricing", () => {
  it("uses variant-specific modifier price override before inherited price", () => {
    expect(
      resolveVariantModifierOptionPrice({
        selectedVariantId: "size-16",
        modifierGroupId: "toppings",
        modifierOptionId: "pepperoni",
        inheritedPriceDelta: 1.5,
        priceOverrides,
      })
    ).toBe(2.5)
  })

  it("falls back to inherited price when variant override is missing", () => {
    expect(
      resolveVariantModifierOptionPrice({
        selectedVariantId: "size-14",
        modifierGroupId: "toppings",
        modifierOptionId: "pepperoni",
        inheritedPriceDelta: 2,
        priceOverrides,
      })
    ).toBe(2)
  })

  it("restores inherited price when a variant-specific override is cleared", () => {
    expect(
      resolveVariantModifierOptionPrice({
        selectedVariantId: "size-16",
        modifierGroupId: "toppings",
        modifierOptionId: "pepperoni",
        inheritedPriceDelta: 2,
        priceOverrides: [],
      })
    ).toBe(2)
  })

  it("ignores disabled variant-specific modifier price override", () => {
    expect(
      resolveVariantModifierOptionPrice({
        selectedVariantId: "size-12",
        modifierGroupId: "toppings",
        modifierOptionId: "pepperoni",
        inheritedPriceDelta: 1.75,
        priceOverrides: [
          {
            variant_group_option_id: "size-12",
            modifier_group_id: "toppings",
            modifier_option_id: "pepperoni",
            price_delta: 9,
            is_enabled: false,
          },
        ],
      })
    ).toBe(1.75)
  })

  it("matches overrides by modifier group id", () => {
    expect(
      resolveVariantModifierOptionPrice({
        selectedVariantId: "size-16",
        modifierGroupId: "premium-toppings",
        modifierOptionId: "pepperoni",
        inheritedPriceDelta: 3,
        priceOverrides,
      })
    ).toBe(3)
  })

  it("changes displayed modifier prices when selected variant changes", () => {
    const groups = [
      {
        id: "toppings",
        modifier_options: [
          {
            id: "pepperoni",
            price_delta: 1.5,
          },
        ],
      },
    ]

    expect(
      applyVariantModifierOptionPrices({
        selectedVariantId: "size-10",
        modifierGroups: groups,
        priceOverrides,
      })[0].modifier_options[0].price_delta
    ).toBe(1)

    expect(
      applyVariantModifierOptionPrices({
        selectedVariantId: "size-16",
        modifierGroups: groups,
        priceOverrides,
      })[0].modifier_options[0].price_delta
    ).toBe(2.5)
  })
})
