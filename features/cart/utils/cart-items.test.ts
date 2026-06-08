import { describe, expect, it } from "vitest"
import type {
  ConfiguredCartItem,
  DealCartItem,
} from "@/features/cart/types/cart"
import {
  getCartItemCount,
  getCartSubtotal,
  isCartItem,
  isConfiguredCartItem,
  isDealCartItem,
} from "./cart-items"

const configuredItem: ConfiguredCartItem = {
  cartItemId: "configured-1",
  itemType: "configured",
  businessId: "business-1",
  businessSlug: "demo",
  locationId: "location-1",
  locationSlug: "main",
  productId: "product-1",
  productName: "Pepperoni Pizza",
  variantId: "large",
  variantName: "Large",
  quantity: 2,
  unitPrice: 12.5,
  totalPrice: 25,
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
}

const dealItem: DealCartItem = {
  cartItemId: "deal-1",
  itemType: "deal",
  businessId: "business-1",
  businessSlug: "demo",
  locationId: "location-1",
  locationSlug: "main",
  specialId: "special-1",
  specialName: "Family Deal",
  dealBasePrice: 24.99,
  childExtraTotal: 3,
  totalPrice: 27.99,
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
          productId: "product-2",
          productName: "Build Your Own Pizza",
          variantId: "large",
          variantName: "Large",
          quantity: 1,
          configuredLineTotal: 18,
          childExtraTotal: 3,
          modifiers: [
            {
              optionId: "mushrooms",
              optionName: "Mushrooms",
              groupId: "toppings",
              groupName: "Toppings",
              placement: "left",
              multiplier: 1,
              priceDelta: 1.5,
            },
          ],
        },
      ],
    },
  ],
}

describe("cart item helpers", () => {
  it("accepts legacy configured items without an itemType", () => {
    const legacyItem = {
      ...configuredItem,
      itemType: undefined,
    }

    expect(isConfiguredCartItem(legacyItem)).toBe(true)
    expect(isCartItem(legacyItem)).toBe(true)
  })

  it("accepts nested deal cart items", () => {
    expect(isDealCartItem(dealItem)).toBe(true)
    expect(isCartItem(dealItem)).toBe(true)
  })

  it("rejects invalid cart item shapes", () => {
    expect(
      isCartItem({
        cartItemId: "bad",
        itemType: "deal",
        specialId: "special-1",
      })
    ).toBe(false)
  })

  it("sums configured items and deal parent totals without flattening children", () => {
    expect(getCartSubtotal([configuredItem, dealItem])).toBeCloseTo(52.99)
  })

  it("counts configured quantity and one deal parent line", () => {
    expect(getCartItemCount([configuredItem, dealItem])).toBe(3)
  })
})
