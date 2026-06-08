import { afterEach, describe, expect, it, vi } from "vitest"
import type { ConfiguredProductResult } from "@/features/cart/types/cart"
import { submitConfiguredProductResult } from "./submit-configured-product-result"

const result: ConfiguredProductResult = {
  productId: "product-1",
  productName: "Cheese Pizza",
  variantId: null,
  variantName: null,
  quantity: 1,
  unitPrice: 10,
  totalPrice: 10,
  configuredLineTotal: 10,
  chargedModifierTotal: 0,
  modifierExtraTotal: 0,
  childExtraTotal: 0,
  modifiers: [],
}

describe("submitConfiguredProductResult", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns configured results without mutating cart in return mode", () => {
    const addItem = vi.fn()
    const updateItem = vi.fn()
    const onConfiguredItem = vi.fn()

    const submitResult = submitConfiguredProductResult({
      submitBehavior: "return",
      mode: "create",
      result,
      onConfiguredItem,
      addItem,
      updateItem,
    })

    expect(submitResult).toEqual({ ok: true, cartItem: null })
    expect(onConfiguredItem).toHaveBeenCalledWith(result)
    expect(addItem).not.toHaveBeenCalled()
    expect(updateItem).not.toHaveBeenCalled()
  })

  it("warns and no-ops when return mode has no callback", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const addItem = vi.fn()
    const updateItem = vi.fn()

    const submitResult = submitConfiguredProductResult({
      submitBehavior: "return",
      mode: "create",
      result,
      addItem,
      updateItem,
    })

    expect(submitResult).toEqual({ ok: false, cartItem: null })
    expect(warn).toHaveBeenCalledWith(
      "ProductConfigurator return mode submitted without onConfiguredItem."
    )
    expect(addItem).not.toHaveBeenCalled()
    expect(updateItem).not.toHaveBeenCalled()
  })

  it("preserves normal cart edit behavior", () => {
    const addItem = vi.fn()
    const updateItem = vi.fn()
    const existingCartItem = {
      cartItemId: "cart-1",
      ...result,
      quantity: 1,
    }

    const submitResult = submitConfiguredProductResult({
      submitBehavior: "cart",
      mode: "edit",
      result: {
        ...result,
        quantity: 2,
        totalPrice: 20,
        configuredLineTotal: 20,
      },
      existingCartItem,
      addItem,
      updateItem,
    })

    expect(submitResult.ok).toBe(true)
    expect(addItem).not.toHaveBeenCalled()
    expect(updateItem).toHaveBeenCalledWith(
      "cart-1",
      expect.objectContaining({
        cartItemId: "cart-1",
        quantity: 2,
        totalPrice: 20,
      })
    )
  })
})
