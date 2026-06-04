import { describe, expect, it } from "vitest"
import { buildModifierOptionWritePayload } from "./modifier-option-write-payload"

describe("buildModifierOptionWritePayload", () => {
  it("create payload saves sort_order", () => {
    expect(
      buildModifierOptionWritePayload({
        modifierOptionGroupId: "veggies",
        name: "Cucumber",
        priceDelta: 0.5,
        sortOrder: 4,
      })
    ).toMatchObject({
      modifier_option_group_id: "veggies",
      name: "Cucumber",
      price_delta: 0.5,
      sort_order: 4,
    })
  })

  it("edit payload saves sort_order", () => {
    expect(
      buildModifierOptionWritePayload({
        modifierOptionGroupId: "cheeses",
        name: "Cheddar",
        priceDelta: 1,
        sortOrder: 2,
      }).sort_order
    ).toBe(2)
  })
})

