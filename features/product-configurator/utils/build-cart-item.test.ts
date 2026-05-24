import { describe, expect, it } from "vitest"
import { buildConfiguredCartItem } from "./build-cart-item"

describe("buildConfiguredCartItem", () => {
  it("stores reusable variant id, name, and resolved price", () => {
    const cartItem = buildConfiguredCartItem({
      cartItemId: "cart-1",
      productId: "product-pizza",
      productName: "Build Your Own Pizza",
      selectedVariant: {
        id: "variant-option-16",
        name: '16"',
        base_price: 17.99,
      },
      quantity: 2,
      unitPrice: 19.49,
      modifiers: [
        {
          optionId: "pepperoni",
          optionName: "Pepperoni",
          groupId: "toppings",
          groupName: "Pizza Toppings",
          placement: "whole",
          multiplier: 1,
          priceDelta: 1.5,
        },
      ],
    })

    expect(cartItem).toMatchObject({
      variantId: "variant-option-16",
      variantName: '16"',
      unitPrice: 19.49,
      totalPrice: 38.98,
    })
  })
})
