import { describe, expect, it } from "vitest"
import { calculateProductTotal } from "./calculate-product-total"

describe("calculateProductTotal", () => {
  it("returns the base price when no modifiers are selected", () => {
    const total = calculateProductTotal({
      basePrice: 8.99,
      modifierGroups: [],
      selectedModifiers: {},
    })

    expect(total).toBe(8.99)
  })

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
    })

    expect(total).toBe(12.49)
  })

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
    })

    expect(total).toBe(11.99)
  })

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
    })

    expect(total).toBe(8.99)
  })
})