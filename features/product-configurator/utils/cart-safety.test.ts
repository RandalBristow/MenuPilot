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

  it("rehydrates reusable variant and selected modifiers that are still available", () => {
    const enabledVariants = [
      {
        id: "size-10",
        is_default: false,
      },
      {
        id: "size-12",
        is_default: true,
      },
    ]
    const selectedModifiers = [
      {
        optionId: "pepperoni",
      },
      {
        optionId: "ranch",
      },
    ]
    const modifierGroups = [
      {
        modifier_options: [{ id: "pepperoni" }, { id: "ranch" }],
      },
    ]

    expect(getSafeInitialVariantId(enabledVariants, "size-10")).toBe("size-10")
    expect(
      getResolvableSelectedModifiers(selectedModifiers, modifierGroups)
    ).toEqual(selectedModifiers)
  })
})
