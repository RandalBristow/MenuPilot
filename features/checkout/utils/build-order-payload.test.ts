import { describe, expect, it } from "vitest"
import type { CartItem } from "@/features/cart/types/cart"
import {
  buildOrderInsertPayload,
  buildOrderItemInsertPayload,
  buildOrderModifierInsertPayload,
} from "./build-order-payload"

const cartItem = {
  cartItemId: "cart-1",
  productId: "product-pizza",
  productName: "Build Your Own Pizza",
  variantId: "variant-option-16",
  variantName: '16"',
  quantity: 2,
  unitPrice: 19.49,
  totalPrice: 38.98,
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
} satisfies CartItem

const cartItemWithoutVariant = {
  cartItemId: "cart-2",
  productId: "product-fries",
  productName: "French Fries",
  variantId: null,
  variantName: null,
  quantity: 1,
  unitPrice: 4.99,
  totalPrice: 4.99,
  modifiers: [],
} satisfies CartItem

describe("checkout order payload helpers", () => {
  it("builds order totals from resolved cart item values", () => {
    const payload = buildOrderInsertPayload({
      businessId: "business-1",
      locationId: "location-1",
      orderNumber: "MP-123",
      customerName: "Randy",
      customerPhone: "555-0100",
      fulfillmentType: "pickup",
      items: [cartItem],
    })

    expect(payload.subtotal).toBe(38.98)
    expect(payload.total).toBe(38.98)
  })

  it("builds order item payload without legacy product_variant_id", () => {
    const payload = buildOrderItemInsertPayload({
      businessId: "business-1",
      orderId: "order-1",
      item: cartItem,
    })

    expect(payload).toEqual({
      business_id: "business-1",
      order_id: "order-1",
      product_id: "product-pizza",
      variant_group_option_id: "variant-option-16",
      product_name_snapshot: "Build Your Own Pizza",
      variant_name_snapshot: '16"',
      quantity: 2,
      unit_price: 19.49,
      line_subtotal: 38.98,
    })
    expect(payload).not.toHaveProperty("product_variant_id")
  })

  it("creates a valid order item payload for a reusable variant cart item", () => {
    const payload = buildOrderItemInsertPayload({
      businessId: "business-1",
      orderId: "order-1",
      item: cartItem,
    })

    expect(cartItem.variantId).toBe("variant-option-16")
    expect(payload.variant_group_option_id).toBe("variant-option-16")
    expect(payload.variant_name_snapshot).toBe('16"')
    expect(payload.unit_price).toBe(19.49)
    expect(payload.line_subtotal).toBe(38.98)
  })

  it("creates a valid order item payload for a product without variants", () => {
    const payload = buildOrderItemInsertPayload({
      businessId: "business-1",
      orderId: "order-1",
      item: cartItemWithoutVariant,
    })

    expect(payload).toEqual({
      business_id: "business-1",
      order_id: "order-1",
      product_id: "product-fries",
      variant_group_option_id: null,
      product_name_snapshot: "French Fries",
      variant_name_snapshot: null,
      quantity: 1,
      unit_price: 4.99,
      line_subtotal: 4.99,
    })
    expect(payload).not.toHaveProperty("product_variant_id")
  })

  it("stores modifier snapshots for staff display", () => {
    const [payload] = buildOrderModifierInsertPayload({
      businessId: "business-1",
      orderItemId: "order-item-1",
      modifiers: cartItem.modifiers,
    })

    expect(payload).toMatchObject({
      business_id: "business-1",
      order_item_id: "order-item-1",
      modifier_group_id: "toppings",
      modifier_option_id: "pepperoni",
      group_name_snapshot: "Pizza Toppings",
      option_name_snapshot: "Pepperoni",
      placement: "whole",
      multiplier: 1,
      price_delta: 1.5,
      quantity: 1,
    })
  })
})
