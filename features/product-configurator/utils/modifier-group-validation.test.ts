import { describe, expect, it } from "vitest"
import { getModifierGroupValidationMessage } from "./modifier-group-validation"

describe("getModifierGroupValidationMessage", () => {
  it("requires selection for required modifier groups with enabled options", () => {
    const message = getModifierGroupValidationMessage(
      {
        is_required: true,
        min_required: 1,
        max_allowed: null,
        modifier_options: [{ id: "pepperoni" }],
      },
      []
    )

    expect(message).toBe("Please choose at least 1.")
  })

  it("does not block add-to-cart for required groups with zero enabled options", () => {
    const message = getModifierGroupValidationMessage(
      {
        is_required: true,
        min_required: 1,
        max_allowed: null,
        modifier_options: [],
      },
      []
    )

    expect(message).toBeNull()
  })

  it("keeps max validation unchanged", () => {
    const message = getModifierGroupValidationMessage(
      {
        is_required: false,
        min_required: 0,
        max_allowed: 1,
        modifier_options: [{ id: "pepperoni" }, { id: "sausage" }],
      },
      ["pepperoni", "sausage"]
    )

    expect(message).toBe("Please choose no more than 1.")
  })
})
