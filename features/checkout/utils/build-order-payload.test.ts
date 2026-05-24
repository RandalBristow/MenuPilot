import { describe, expect, it } from "vitest"
import type { ValidatedPricedCartItem } from "./validate-and-price-cart"
import { validateAndPriceCart } from "./validate-and-price-cart"
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
  lineSubtotal: 38.98,
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
} satisfies ValidatedPricedCartItem

const cartItemWithoutVariant = {
  cartItemId: "cart-2",
  productId: "product-fries",
  productName: "French Fries",
  variantId: null,
  variantName: null,
  quantity: 1,
  unitPrice: 4.99,
  lineSubtotal: 4.99,
  modifiers: [],
} satisfies ValidatedPricedCartItem

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

  it("uses validated priced values instead of client-submitted cart prices", () => {
    const validationResult = validateAndPriceCart({
      items: [
        {
          cartItemId: "cart-3",
          productId: "product-pizza",
          productName: "Tampered Product",
          variantId: "variant-option-16",
          variantName: "Tampered Variant",
          quantity: 2,
          unitPrice: 0.01,
          totalPrice: 0.02,
          modifiers: [
            {
              optionId: "pepperoni",
              optionName: "Tampered Pepperoni",
              groupId: "toppings",
              groupName: "Tampered Toppings",
              placement: "whole",
              multiplier: 1,
              priceDelta: 100,
            },
          ],
        },
      ],
      products: [
        {
          id: "product-pizza",
          name: "Build Your Own Pizza",
          isEnabled: true,
          basePrice: 12.5,
          variants: [
            {
              id: "variant-option-16",
              name: '16"',
              basePrice: 19.49,
              isEnabled: true,
            },
          ],
          modifierGroups: [
            {
              id: "toppings",
              name: "Pizza Toppings",
              isAssignmentEnabled: true,
              isEnabled: true,
              isRequired: false,
              minRequired: 0,
              maxAllowed: null,
              supportsPlacement: true,
              supportsMultiplier: false,
              options: [
                {
                  id: "pepperoni",
                  name: "Pepperoni",
                  priceDelta: 1.5,
                  isEnabled: true,
                  optionGroup: null,
                },
              ],
            },
          ],
        },
      ],
    })

    expect(validationResult.ok).toBe(true)
    if (!validationResult.ok) return

    const payload = buildOrderInsertPayload({
      businessId: "business-1",
      locationId: "location-1",
      orderNumber: "MP-123",
      customerName: "Randy",
      customerPhone: "555-0100",
      fulfillmentType: "pickup",
      items: validationResult.cart.items,
    })
    const itemPayload = buildOrderItemInsertPayload({
      businessId: "business-1",
      orderId: "order-1",
      item: validationResult.cart.items[0],
    })
    const [modifierPayload] = buildOrderModifierInsertPayload({
      businessId: "business-1",
      orderItemId: "order-item-1",
      modifiers: validationResult.cart.items[0].modifiers,
    })

    expect(payload.subtotal).toBe(41.98)
    expect(payload.total).toBe(41.98)
    expect(itemPayload).toMatchObject({
      product_name_snapshot: "Build Your Own Pizza",
      variant_group_option_id: "variant-option-16",
      variant_name_snapshot: '16"',
      unit_price: 20.99,
      line_subtotal: 41.98,
    })
    expect(modifierPayload).toMatchObject({
      modifier_group_id: "toppings",
      modifier_option_id: "pepperoni",
      group_name_snapshot: "Pizza Toppings",
      option_name_snapshot: "Pepperoni",
      price_delta: 1.5,
    })
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
