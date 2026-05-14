import { describe, expect, it } from "vitest"
import {
  getResolvableSelectedModifiers,
  getSafeInitialVariantId,
} from "./cart-safety"

describe("cart safety helpers", () => {
  it("does not crash when a cart item has a previously selected disabled modifier", () => {
    const selectedModifiers = [
      {
        optionId: "disabled-option",
      },
      {
        optionId: "enabled-option",
      },
    ]
    const modifierGroups = [
      {
        modifier_options: [{ id: "enabled-option" }],
      },
    ]

    expect(() =>
      getResolvableSelectedModifiers(selectedModifiers, modifierGroups)
    ).not.toThrow()
    expect(
      getResolvableSelectedModifiers(selectedModifiers, modifierGroups)
    ).toEqual([{ optionId: "enabled-option" }])
  })

  it("does not crash when a cart item has a previously selected disabled variant", () => {
    const enabledVariants = [
      {
        id: "small",
        is_default: true,
      },
    ]

    expect(() =>
      getSafeInitialVariantId(enabledVariants, "disabled-large")
    ).not.toThrow()
    expect(getSafeInitialVariantId(enabledVariants, "disabled-large")).toBe(
      "small"
    )
  })
})
