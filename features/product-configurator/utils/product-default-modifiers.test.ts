import { describe, expect, it } from "vitest"
import { calculateProductTotal } from "../../../lib/pricing/calculate-product-total"
import { getInitialSelectedModifiersFromDefaults } from "./product-default-modifiers"

const modifierGroups = [
  {
    modifier_options: [{ id: "thin" }, { id: "pepperoni" }],
  },
]

describe("getInitialSelectedModifiersFromDefaults", () => {
  it("loads product defaults that are currently available", () => {
    expect(
      getInitialSelectedModifiersFromDefaults({
        defaults: [
          {
            modifier_option_id: "thin",
            placement: "whole",
            multiplier: 1,
            is_enabled: true,
            sort_order: 0,
          },
        ],
        modifierGroups,
      })
    ).toEqual({
      thin: {
        optionId: "thin",
        placement: "whole",
        multiplier: 1,
      },
    })
  })

  it("keeps defaults product-specific by only using defaults passed for this product", () => {
    expect(
      getInitialSelectedModifiersFromDefaults({
        defaults: [
          {
            modifier_option_id: "pepperoni",
            placement: "whole",
            multiplier: 1,
            is_enabled: true,
            sort_order: 0,
          },
        ],
        modifierGroups,
      })
    ).toEqual({
      pepperoni: {
        optionId: "pepperoni",
        placement: "whole",
        multiplier: 1,
      },
    })
  })

  it("does not preselect unavailable defaults", () => {
    expect(
      getInitialSelectedModifiersFromDefaults({
        defaults: [
          {
            modifier_option_id: "thin",
            placement: "whole",
            multiplier: 1,
            is_enabled: true,
            sort_order: 0,
          },
        ],
        modifierGroups: [
          {
            modifier_options: [{ id: "pepperoni" }],
          },
        ],
      })
    ).toEqual({})
  })

  it("ignores disabled default records", () => {
    expect(
      getInitialSelectedModifiersFromDefaults({
        defaults: [
          {
            modifier_option_id: "thin",
            placement: "whole",
            multiplier: 1,
            is_enabled: false,
            sort_order: 0,
          },
        ],
        modifierGroups,
      })
    ).toEqual({})
  })

  it("prices defaults the same as selected modifiers", () => {
    const selectedModifiers = getInitialSelectedModifiersFromDefaults({
      defaults: [
        {
          modifier_option_id: "pepperoni",
          placement: "whole",
          multiplier: 1,
          is_enabled: true,
          sort_order: 0,
        },
      ],
      modifierGroups,
    })

    expect(
      calculateProductTotal({
        basePrice: 12,
        modifierGroups: [
          {
            id: "toppings",
            modifier_options: [
              {
                id: "pepperoni",
                price_delta: 1.5,
              },
            ],
          },
        ],
        selectedModifiers,
      })
    ).toBe(13.5)
  })
})
