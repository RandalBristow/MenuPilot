import { describe, expect, it } from "vitest"
import type { CartItem } from "@/features/cart/types/cart"
import { getCartItemDisplaySnapshot } from "./get-cart-item-display-snapshot"

describe("getCartItemDisplaySnapshot", () => {
  it("uses cart snapshot names when live variant or modifier records are unavailable", () => {
    const item = {
      cartItemId: "cart-1",
      productId: "product-pizza",
      productName: "Build Your Own Pizza",
      variantId: "disabled-variant",
      variantName: '16"',
      quantity: 1,
      unitPrice: 19.49,
      totalPrice: 19.49,
      modifiers: [
        {
          optionId: "disabled-option",
          optionName: "Gluten Free",
          groupId: "crust",
          groupName: "Crust Type",
          placement: "whole",
          multiplier: 1,
          priceDelta: 2,
        },
      ],
    } satisfies CartItem

    expect(() => getCartItemDisplaySnapshot(item)).not.toThrow()
    expect(getCartItemDisplaySnapshot(item)).toEqual({
      productName: "Build Your Own Pizza",
      variantName: '16"',
      modifierNames: ["Gluten Free"],
    })
  })
})
