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

  it("uses deal and child modifier snapshots for orderable deal cart items", () => {
    const item = {
      cartItemId: "deal-1",
      itemType: "deal",
      businessId: "business-1",
      businessSlug: "demo",
      locationId: "location-1",
      locationSlug: "main",
      specialId: "special-1",
      specialName: "Family Deal",
      dealBasePrice: 24.99,
      childExtraTotal: 0,
      totalPrice: 24.99,
      components: [
        {
          componentId: "component-1",
          componentLabel: "Choose a Pizza",
          sortOrder: 1,
          requiredQuantity: 1,
          selectedQuantity: 1,
          children: [
            {
              childLineId: "child-1",
              productId: "product-pizza",
              productName: "Build Your Own Pizza",
              variantId: "large",
              variantName: "Large",
              quantity: 1,
              configuredLineTotal: 18,
              childExtraTotal: 0,
              modifiers: [
                {
                  optionId: "pepperoni",
                  optionName: "Pepperoni",
                  groupId: "toppings",
                  groupName: "Toppings",
                  placement: "whole",
                  multiplier: 1,
                  priceDelta: 0,
                },
              ],
            },
          ],
        },
      ],
    } satisfies CartItem

    expect(getCartItemDisplaySnapshot(item)).toEqual({
      productName: "Family Deal",
      variantName: null,
      modifierNames: ["Pepperoni"],
    })
  })
})
