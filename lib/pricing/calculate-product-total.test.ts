import { describe, expect, it } from "vitest";
import {
  calculateProductTotal,
  getPricedSelectedModifiers,
} from "./calculate-product-total";

describe("calculateProductTotal", () => {
  it("returns the base price when no modifiers are selected", () => {
    const total = calculateProductTotal({
      basePrice: 8.99,
      modifierGroups: [],
      selectedModifiers: {},
    });

    expect(total).toBe(8.99);
  });

  it("adds selected modifier prices", () => {
    const total = calculateProductTotal({
      basePrice: 8.99,
      modifierGroups: [
        {
          id: "pizza-toppings",
          modifier_options: [
            {
              id: "pepperoni",
              price_delta: 1.5,
            },
            {
              id: "bacon",
              price_delta: 2,
            },
          ],
        },
      ],
      selectedModifiers: {
        pepperoni: {
          optionId: "pepperoni",
          multiplier: 1,
        },
        bacon: {
          optionId: "bacon",
          multiplier: 1,
        },
      },
    });

    expect(total).toBe(12.49);
  });

  it("multiplies modifier prices by multiplier", () => {
    const total = calculateProductTotal({
      basePrice: 8.99,
      modifierGroups: [
        {
          id: "pizza-toppings",
          modifier_options: [
            {
              id: "pepperoni",
              price_delta: 1.5,
            },
          ],
        },
      ],
      selectedModifiers: {
        pepperoni: {
          optionId: "pepperoni",
          multiplier: 2,
        },
      },
    });

    expect(total).toBe(11.99);
  });

  it("ignores selected modifiers that are not found in available options", () => {
    const total = calculateProductTotal({
      basePrice: 8.99,
      modifierGroups: [],
      selectedModifiers: {
        unknown: {
          optionId: "unknown",
          multiplier: 1,
        },
      },
    });

    expect(total).toBe(8.99);
  });

  it("does not charge for selected modifiers within included quantity", () => {
    const total = calculateProductTotal({
      basePrice: 10,
      modifierGroups: [
        {
          id: "pizza-toppings",
          included_quantity: 3,
          charge_for_extra: true,
          modifier_options: [
            { id: "pepperoni", price_delta: 1.5 },
            { id: "sausage", price_delta: 1.5 },
            { id: "mushrooms", price_delta: 1.25 },
          ],
        },
      ],
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 1 },
        sausage: { optionId: "sausage", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
      },
    });

    expect(total).toBe(10);
  });

  it("charges only for modifiers beyond included quantity", () => {
    const total = calculateProductTotal({
      basePrice: 10,
      modifierGroups: [
        {
          id: "pizza-toppings",
          included_quantity: 3,
          charge_for_extra: true,
          modifier_options: [
            { id: "pepperoni", price_delta: 1.5 },
            { id: "sausage", price_delta: 1.5 },
            { id: "mushrooms", price_delta: 1.25 },
            { id: "bacon", price_delta: 2 },
          ],
        },
      ],
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 1 },
        sausage: { optionId: "sausage", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
        bacon: { optionId: "bacon", multiplier: 1 },
      },
    });

    expect(total).toBe(12);
  });

  it("charges selected toppings after the first included selections", () => {
    const total = calculateProductTotal({
      basePrice: 10,
      modifierGroups: [
        {
          id: "pizza-toppings",
          included_quantity: 2,
          charge_for_extra: true,
          modifier_options: [
            { id: "pepperoni", price_delta: 1.5 },
            { id: "bacon", price_delta: 2 },
            { id: "mushrooms", price_delta: 1.25 },
          ],
        },
      ],
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 1 },
        bacon: { optionId: "bacon", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
      },
    });

    expect(total).toBe(11.25);
  });

  it("multiplier consumes included credits correctly", () => {
    const total = calculateProductTotal({
      basePrice: 10,
      modifierGroups: [
        {
          id: "pizza-toppings",
          included_quantity: 2,
          charge_for_extra: true,
          modifier_options: [{ id: "pepperoni", price_delta: 1.5 }],
        },
      ],
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 2 },
      },
    });

    expect(total).toBe(10);
  });

  it("charges extra units beyond included credits", () => {
    const total = calculateProductTotal({
      basePrice: 10,
      modifierGroups: [
        {
          id: "pizza-toppings",
          included_quantity: 2,
          charge_for_extra: true,
          modifier_options: [{ id: "pepperoni", price_delta: 1.5 }],
        },
      ],
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 3 },
      },
    });

    expect(total).toBe(11.5);
  });

  it("distributes credits across multiple toppings correctly", () => {
    const total = calculateProductTotal({
      basePrice: 10,
      modifierGroups: [
        {
          id: "pizza-toppings",
          included_quantity: 2,
          charge_for_extra: true,
          modifier_options: [
            { id: "pepperoni", price_delta: 1.5 },
            { id: "bacon", price_delta: 2 },
          ],
        },
      ],
      selectedModifiers: {
        bacon: { optionId: "bacon", multiplier: 1 },
        pepperoni: { optionId: "pepperoni", multiplier: 2 },
      },
    });

    // bacon (2.00) gets covered first
    // 1 credit left → pepperoni uses 1 free, 1 paid → 1.5
    expect(total).toBe(11.5);
  });

  it("returns zero price deltas for included default selections", () => {
    const pricedModifiers = getPricedSelectedModifiers({
      modifierGroups: [
        {
          id: "salad-toppings",
          included_quantity: 2,
          charge_for_extra: true,
          modifier_options: [
            { id: "tomatoes", price_delta: 1 },
            { id: "onions", price_delta: 1 },
          ],
        },
      ],
      selectedModifiers: {
        tomatoes: { optionId: "tomatoes", multiplier: 1 },
        onions: { optionId: "onions", multiplier: 1 },
      },
    });

    expect(pricedModifiers.tomatoes.priceDelta).toBe(0);
    expect(pricedModifiers.onions.priceDelta).toBe(0);
  });

  it("charges the third selected salad topping", () => {
    const pricedModifiers = getPricedSelectedModifiers({
      modifierGroups: [
        {
          id: "salad-toppings",
          included_quantity: 2,
          charge_for_extra: true,
          modifier_options: [
            { id: "tomatoes", price_delta: 1 },
            { id: "onions", price_delta: 1 },
            { id: "mushrooms", price_delta: 1.5 },
          ],
        },
      ],
      selectedModifiers: {
        tomatoes: { optionId: "tomatoes", multiplier: 1 },
        onions: { optionId: "onions", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
      },
    });

    expect(pricedModifiers.tomatoes.priceDelta).toBe(0);
    expect(pricedModifiers.onions.priceDelta).toBe(0);
    expect(pricedModifiers.mushrooms.priceDelta).toBe(1.5);
  });

  it("counts product default modifiers as included selections", () => {
    const total = calculateProductTotal({
      basePrice: 8,
      modifierGroups: [
        {
          id: "salad-toppings",
          included_quantity: 2,
          charge_for_extra: true,
          modifier_options: [
            { id: "grilled-chicken", price_delta: 1.5 },
            { id: "tomatoes", price_delta: 1 },
            { id: "cheddar", price_delta: 1.5 },
            { id: "onions", price_delta: 1 },
            { id: "mushrooms", price_delta: 1.25 },
            { id: "bacon", price_delta: 2 },
          ],
        },
      ],
      selectedModifiers: {
        "grilled-chicken": { optionId: "grilled-chicken", multiplier: 1 },
        tomatoes: { optionId: "tomatoes", multiplier: 1 },
        cheddar: { optionId: "cheddar", multiplier: 1 },
        onions: { optionId: "onions", multiplier: 1 },
        mushrooms: { optionId: "mushrooms", multiplier: 1 },
        bacon: { optionId: "bacon", multiplier: 1 },
      },
      includedModifierOptionUnits: {
        "grilled-chicken": 1,
        tomatoes: 1,
        cheddar: 1,
      },
    });

    expect(total).toBe(13.75);
  });

  it("charges product defaults when no included rule is present", () => {
    const total = calculateProductTotal({
      basePrice: 8,
      modifierGroups: [
        {
          id: "salad-dressing",
          modifier_options: [{ id: "ranch", price_delta: 0.95 }],
        },
      ],
      selectedModifiers: {
        ranch: { optionId: "ranch", multiplier: 1 },
      },
      includedModifierOptionUnits: {
        ranch: 1,
      },
    });

    expect(total).toBe(8.95);
  });

  it("charges all selected modifiers when no included rule is present", () => {
    const total = calculateProductTotal({
      basePrice: 10,
      modifierGroups: [
        {
          id: "salad-toppings",
          modifier_options: [
            { id: "tomatoes", price_delta: 1 },
            { id: "onions", price_delta: 1 },
          ],
        },
      ],
      selectedModifiers: {
        tomatoes: { optionId: "tomatoes", multiplier: 1 },
        onions: { optionId: "onions", multiplier: 1 },
      },
    });

    expect(total).toBe(12);
  });
});
