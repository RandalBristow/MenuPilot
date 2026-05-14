import { describe, expect, it } from "vitest"
import { getModifierOptionDeleteStrategy } from "./get-modifier-option-delete-strategy"

describe("getModifierOptionDeleteStrategy", () => {
  it("prevents permanent delete when a modifier option has order usage", () => {
    expect(
      getModifierOptionDeleteStrategy({
        usedByProducts: false,
        usedByOrders: true,
      })
    ).toBe("disable")
  })

  it("prevents permanent delete when a modifier option group is used by products", () => {
    expect(
      getModifierOptionDeleteStrategy({
        usedByProducts: true,
        usedByOrders: false,
      })
    ).toBe("disable")
  })

  it("allows permanent delete when a modifier option has no usage", () => {
    expect(
      getModifierOptionDeleteStrategy({
        usedByProducts: false,
        usedByOrders: false,
      })
    ).toBe("delete")
  })

  it("keeps disable available when permanent delete is blocked", () => {
    expect(
      getModifierOptionDeleteStrategy({
        usedByProducts: true,
        usedByOrders: true,
      })
    ).toBe("disable")
  })
})
