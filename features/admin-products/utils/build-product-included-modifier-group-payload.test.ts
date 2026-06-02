import { describe, expect, it } from "vitest"
import { buildProductIncludedModifierGroupPayload } from "./build-product-included-modifier-group-payload"

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData()

  formData.set("productId", "product-salad")
  formData.set("modifierGroupId", "salad-toppings")
  formData.set("includedQuantity", "2")
  formData.set("chargeForExtra", "true")

  Object.entries(overrides).forEach(([key, value]) => {
    formData.set(key, value)
  })

  return formData
}

describe("buildProductIncludedModifierGroupPayload", () => {
  it("builds a save payload", () => {
    expect(
      buildProductIncludedModifierGroupPayload(createFormData())
    ).toEqual({
      action: "save",
      productId: "product-salad",
      modifierGroupId: "salad-toppings",
      includedQuantity: 2,
      chargeForExtra: true,
    })
  })

  it("builds a clear payload when included quantity is zero", () => {
    expect(
      buildProductIncludedModifierGroupPayload(
        createFormData({ includedQuantity: "0" })
      )
    ).toEqual({
      action: "clear",
      productId: "product-salad",
      modifierGroupId: "salad-toppings",
    })
  })

  it("builds a clear payload when clear action is requested", () => {
    expect(
      buildProductIncludedModifierGroupPayload(
        createFormData({ clearIncludedRule: "true" })
      )
    ).toEqual({
      action: "clear",
      productId: "product-salad",
      modifierGroupId: "salad-toppings",
    })
  })

  it("rejects non-whole included quantities", () => {
    expect(() =>
      buildProductIncludedModifierGroupPayload(
        createFormData({ includedQuantity: "1.5" })
      )
    ).toThrow("Included selections must be a whole number zero or greater.")
  })
})
