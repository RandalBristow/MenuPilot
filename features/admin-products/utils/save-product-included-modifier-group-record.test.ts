import { describe, expect, it, vi } from "vitest"
import { saveProductIncludedModifierGroupRecord } from "./save-product-included-modifier-group-record"
import type { ProductIncludedModifierGroupPayload } from "./build-product-included-modifier-group-payload"

function createStore() {
  return {
    findExisting: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    clear: vi.fn(),
  }
}

const savePayload = {
  action: "save",
  productId: "product-chicken-salad",
  modifierGroupId: "modifier-group-salad-toppings",
  includedQuantity: 2,
  chargeForExtra: true,
} satisfies ProductIncludedModifierGroupPayload

describe("saveProductIncludedModifierGroupRecord", () => {
  it("creates an included settings row with product_id and modifier_group_id", async () => {
    const store = createStore()
    store.findExisting.mockResolvedValue(null)

    await saveProductIncludedModifierGroupRecord({
      businessId: "business",
      payload: savePayload,
      store,
    })

    expect(store.insert).toHaveBeenCalledWith({
      businessId: "business",
      productId: "product-chicken-salad",
      modifierGroupId: "modifier-group-salad-toppings",
      includedQuantity: 2,
      chargeForExtra: true,
    })
    expect(store.update).not.toHaveBeenCalled()
  })

  it("updates the existing product plus modifier group row", async () => {
    const store = createStore()
    store.findExisting.mockResolvedValue({
      id: "included-rule",
      product_id: "product-chicken-salad",
      modifier_group_id: "modifier-group-salad-toppings",
    })

    await saveProductIncludedModifierGroupRecord({
      businessId: "business",
      payload: savePayload,
      store,
    })

    expect(store.update).toHaveBeenCalledWith({
      id: "included-rule",
      businessId: "business",
      includedQuantity: 2,
      chargeForExtra: true,
    })
    expect(store.insert).not.toHaveBeenCalled()
  })

  it("clears the row for product_id plus modifier_group_id", async () => {
    const store = createStore()

    await saveProductIncludedModifierGroupRecord({
      businessId: "business",
      payload: {
        action: "clear",
        productId: "product-chicken-salad",
        modifierGroupId: "modifier-group-salad-toppings",
      },
      store,
    })

    expect(store.clear).toHaveBeenCalledWith({
      businessId: "business",
      productId: "product-chicken-salad",
      modifierGroupId: "modifier-group-salad-toppings",
    })
    expect(store.findExisting).not.toHaveBeenCalled()
  })
})
