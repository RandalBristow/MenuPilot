import { describe, expect, it } from "vitest"
import { applyEffectiveModifierOptions } from "./apply-effective-modifier-groups"

describe("applyEffectiveModifierOptions", () => {
  it("inherits global modifier option settings without overrides", () => {
    expect(
      applyEffectiveModifierOptions(
        [
          {
            id: "pepperoni",
            name: "Pepperoni",
            price_delta: "1.50",
            is_enabled: true,
            sort_order: 2,
          },
        ],
        []
      )
    ).toEqual([
      expect.objectContaining({
        id: "pepperoni",
        price_delta: 1.5,
        is_enabled: true,
        sort_order: 2,
      }),
    ])
  })

  it("applies product-specific modifier option overrides", () => {
    expect(
      applyEffectiveModifierOptions(
        [
          {
            id: "pepperoni",
            name: "Pepperoni",
            price_delta: 1.5,
            is_enabled: true,
            sort_order: 2,
          },
        ],
        [
          {
            modifier_option_id: "pepperoni",
            price_delta_override: 2,
            is_enabled: false,
            sort_order: 1,
          },
        ]
      )
    ).toEqual([
      expect.objectContaining({
        id: "pepperoni",
        price_delta: 2,
        is_enabled: false,
        sort_order: 1,
      }),
    ])
  })
})
