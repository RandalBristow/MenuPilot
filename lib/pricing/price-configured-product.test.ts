import { describe, expect, it } from "vitest"
import { priceConfiguredProduct } from "./price-configured-product"

const toppingsGroup = {
  id: "toppings",
  included_quantity: 2,
  charge_for_extra: true,
  modifier_options: [
    { id: "pepperoni", price_delta: 1.5 },
    { id: "mushrooms", price_delta: 1 },
    { id: "onions", price_delta: 1.25 },
    { id: "bacon", price_delta: 2 },
  ],
}

describe("priceConfiguredProduct", () => {
  it("prices a pizza with 2 included toppings", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 12,
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
      },
      modifierGroups: [toppingsGroup],
    })

    expect(result.unitPrice).toBe(12)
    expect(result.pricedSelectedModifiers.pepperoni.priceDelta).toBe(0)
    expect(result.pricedSelectedModifiers.mushrooms.priceDelta).toBe(0)
    expect(result.modifierGroups.toppings.includedUnitsUsed).toBe(2)
    expect(result.modifierGroups.toppings.chargedUnits).toBe(0)
  })

  it("prices a salad with 2 included toppings", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 8,
      selectedModifiers: {
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
        onions: { optionId: "onions", multiplier: 1 },
      },
      modifierGroups: [toppingsGroup],
    })

    expect(result.unitPrice).toBe(8)
    expect(result.modifierGroups.toppings.includedUnitsUsed).toBe(2)
  })

  it("defaults consume included slots", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 8,
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
        onions: { optionId: "onions", multiplier: 1 },
      },
      productDefaultModifierOptions: [
        {
          modifier_option_id: "pepperoni",
          multiplier: 1,
          quantity: 1,
          is_enabled: true,
        },
      ],
      modifierGroups: [toppingsGroup],
    })

    expect(result.pricedSelectedModifiers.pepperoni.defaultUnits).toBe(1)
    expect(result.pricedSelectedModifiers.pepperoni.priceDelta).toBe(0)
    expect(result.pricedSelectedModifiers.mushrooms.priceDelta).toBe(0)
    expect(result.pricedSelectedModifiers.onions.priceDelta).toBe(1.25)
    expect(result.unitPrice).toBe(9.25)
  })

  it("charges the 3rd selected topping", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
        onions: { optionId: "onions", multiplier: 1 },
      },
      modifierGroups: [toppingsGroup],
    })

    expect(result.pricedSelectedModifiers.onions.priceDelta).toBe(1.25)
    expect(result.unitPrice).toBe(11.25)
  })

  it("variant-specific modifier price override wins", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      selectedVariant: {
        id: "large",
        base_price: 14,
      },
      selectedModifiers: {
        bacon: { optionId: "bacon", multiplier: 1 },
      },
      modifierGroups: [
        {
          ...toppingsGroup,
          included_quantity: 0,
        },
      ],
      modifierOptionOverrides: [
        {
          modifier_option_id: "bacon",
          price_delta_override: 2.5,
          is_enabled: true,
        },
      ],
      variantModifierOptionPriceOverrides: [
        {
          variant_group_option_id: "large",
          modifier_group_id: "toppings",
          modifier_option_id: "bacon",
          price_delta: 3,
          is_enabled: true,
        },
      ],
    })

    expect(result.basePrice).toBe(14)
    expect(result.pricedSelectedModifiers.bacon.priceDelta).toBe(3)
    expect(result.unitPrice).toBe(17)
  })

  it("product-specific override wins over global when no variant override exists", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      selectedModifiers: {
        bacon: { optionId: "bacon", multiplier: 1 },
      },
      modifierGroups: [
        {
          ...toppingsGroup,
          included_quantity: 0,
        },
      ],
      modifierOptionOverrides: [
        {
          modifier_option_id: "bacon",
          price_delta_override: 2.5,
          is_enabled: true,
        },
      ],
    })

    expect(result.pricedSelectedModifiers.bacon.priceDelta).toBe(2.5)
    expect(result.unitPrice).toBe(12.5)
  })

  it("charges all selected modifiers when no included rule is present", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
      },
      modifierGroups: [
        {
          id: "toppings",
          modifier_options: toppingsGroup.modifier_options,
        },
      ],
    })

    expect(result.unitPrice).toBe(12.5)
    expect(result.modifierGroups.toppings.chargedUnits).toBe(2)
  })

  it("quantity multiplies line total correctly", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      quantity: 3,
      selectedModifiers: {
        bacon: { optionId: "bacon", multiplier: 1 },
      },
      modifierGroups: [
        {
          ...toppingsGroup,
          included_quantity: 0,
        },
      ],
    })

    expect(result.unitPrice).toBe(12)
    expect(result.lineTotal).toBe(36)
  })

  it("charges half price for left or right pizza toppings by default", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      builderTemplate: "pizza",
      selectedModifiers: {
        bacon: { optionId: "bacon", placement: "left", multiplier: 1 },
      },
      modifierGroups: [
        {
          ...toppingsGroup,
          included_quantity: 0,
        },
      ],
    })

    expect(result.pricedSelectedModifiers.bacon.priceDelta).toBe(1)
    expect(result.pricedSelectedModifiers.bacon.pricingUnits).toBe(0.5)
    expect(result.pricedSelectedModifiers.bacon.totalUnits).toBe(0.5)
    expect(result.pricedSelectedModifiers.bacon.multiplier).toBe(1)
    expect(result.unitPrice).toBe(11)
  })

  it("floors half topping price after placement weight and multiplier", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      builderTemplate: "pizza",
      selectedModifiers: {
        bacon: { optionId: "bacon", placement: "left", multiplier: 2 },
      },
      modifierGroups: [
        {
          id: "toppings",
          included_quantity: 0,
          charge_for_extra: true,
          modifier_options: [{ id: "bacon", price_delta: 1.99 }],
        },
      ],
    })

    expect(result.pricedSelectedModifiers.bacon.priceDelta).toBe(1.99)
    expect(result.unitPrice).toBe(11.99)
  })

  it("uses half topping weight for included pizza selections", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      builderTemplate: "pizza",
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", placement: "whole", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", placement: "whole", multiplier: 1 },
        onions: { optionId: "onions", placement: "whole", multiplier: 1 },
        bacon: { optionId: "bacon", placement: "left", multiplier: 1 },
      },
      modifierGroups: [
        {
          ...toppingsGroup,
          included_quantity: 3.5,
        },
      ],
    })

    expect(result.modifierGroups.toppings.includedUnitsUsed).toBe(3.5)
    expect(result.modifierGroups.toppings.chargedUnits).toBe(0)
    expect(result.unitPrice).toBe(10)
  })

  it("charges only the weighted amount beyond included pizza selections", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      builderTemplate: "pizza",
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", placement: "whole", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", placement: "whole", multiplier: 1 },
        onions: { optionId: "onions", placement: "whole", multiplier: 1 },
        bacon: { optionId: "bacon", placement: "left", multiplier: 2 },
      },
      modifierGroups: [
        {
          ...toppingsGroup,
          included_quantity: 3.5,
        },
      ],
    })

    expect(result.modifierGroups.toppings.chargedUnits).toBe(0.5)
    expect(result.pricedSelectedModifiers.bacon.priceDelta).toBe(1)
    expect(result.unitPrice).toBe(11)
  })

  it("does not apply pizza half topping policy to non-pizza builders", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      builderTemplate: "standard",
      selectedModifiers: {
        bacon: { optionId: "bacon", placement: "left", multiplier: 1 },
      },
      modifierGroups: [
        {
          ...toppingsGroup,
          included_quantity: 0,
        },
      ],
    })

    expect(result.pricedSelectedModifiers.bacon.priceDelta).toBe(2)
    expect(result.pricedSelectedModifiers.bacon.totalUnits).toBe(1)
    expect(result.unitPrice).toBe(12)
  })

  it("can disable half included weights while keeping half pricing", () => {
    const result = priceConfiguredProduct({
      productBasePrice: 10,
      builderTemplate: "pizza",
      pricingSettings: {
        pizzaHalfToppingPricingEnabled: true,
        pizzaHalfToppingIncludedWeightEnabled: false,
        pizzaHalfToppingRoundingMode: "floor_to_cent",
      },
      selectedModifiers: {
        bacon: { optionId: "bacon", placement: "left", multiplier: 1 },
      },
      modifierGroups: [
        {
          ...toppingsGroup,
          included_quantity: 0,
        },
      ],
    })

    expect(result.pricedSelectedModifiers.bacon.totalUnits).toBe(1)
    expect(result.pricedSelectedModifiers.bacon.priceDelta).toBe(1)
  })
})
