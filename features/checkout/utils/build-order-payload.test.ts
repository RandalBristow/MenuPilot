import { describe, expect, it } from "vitest"
import type { ValidatedPricedCartItem } from "./validate-and-price-cart"
import { validateAndPriceCart } from "./validate-and-price-cart"
import {
  buildDealChildOrderItemInsertPayload,
  buildDealParentOrderItemInsertPayload,
  buildOrderDiscountInsertPayload,
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

  it("builds order totals with applied specials discount", () => {
    const payload = buildOrderInsertPayload({
      businessId: "business-1",
      locationId: "location-1",
      orderNumber: "MP-123",
      customerName: "Randy",
      customerPhone: "555-0100",
      fulfillmentType: "pickup",
      items: [cartItem],
      discountTotal: 5,
      total: 33.98,
    })

    expect(payload.subtotal).toBe(38.98)
    expect(payload.discount_total).toBe(5)
    expect(payload.total).toBe(33.98)
  })

  it("builds order totals with tax, service fee, tip, and config snapshots", () => {
    const payload = buildOrderInsertPayload({
      businessId: "business-1",
      locationId: "location-1",
      orderNumber: "MP-123",
      customerName: "Randy",
      customerPhone: "555-0100",
      fulfillmentType: "pickup",
      items: [cartItem],
      totals: {
        subtotal: 38.98,
        discountTotal: 5,
        discountedSubtotal: 33.98,
        serviceFeeTotal: 1.5,
        taxTotal: 2.46,
        tipTotal: 4,
        total: 41.94,
        taxRatePercentSnapshot: 7.25,
        serviceFeeTypeSnapshot: "fixed",
        serviceFeeValueSnapshot: 1.5,
        tipBasisSnapshot: "discounted_subtotal",
      },
    })

    expect(payload).toMatchObject({
      subtotal: 38.98,
      discount_total: 5,
      charge_total: 1.5,
      tax_total: 2.46,
      tip_total: 4,
      total: 41.94,
      tax_rate_percent_snapshot: 7.25,
      service_fee_type_snapshot: "fixed",
      service_fee_value_snapshot: 1.5,
      tip_basis_snapshot: "discounted_subtotal",
    })
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
      relationship_type: null,
      parent_order_item_id: null,
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
      relationship_type: null,
      parent_order_item_id: null,
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

  it("builds parent and child deal order item payloads", () => {
    const parentPayload = buildDealParentOrderItemInsertPayload({
      businessId: "business-1",
      orderId: "order-1",
      item: {
        itemType: "deal",
        specialType: "orderable_deal",
        cartItemId: "deal-cart-1",
        specialId: "deal-1",
        specialName: "Family Deal",
        quantity: 1,
        unitPrice: 26.99,
        lineSubtotal: 26.99,
        dealBasePrice: 24.99,
        componentBaseTotal: 24.99,
        usesComponentPricing: true,
        childExtraTotal: 2,
        components: [
          {
            componentId: "component-1",
            label: "Choose a pizza",
            sortOrder: 1,
            requiredQuantity: 1,
            minQuantity: 1,
            maxQuantity: 1,
            selectedQuantity: 1,
            pricingBehavior: "included_base",
            pricingMode: "fixed_price",
            fixedPrice: 24.99,
            componentBaseTotal: 24.99,
            children: [],
          },
        ],
      },
    })
    const childPayload = buildDealChildOrderItemInsertPayload({
      businessId: "business-1",
      orderId: "order-1",
      parentOrderItemId: "parent-item-1",
      child: {
        childLineId: "child-1",
        componentId: "component-1",
        componentLabel: "Choose a pizza",
        productId: "product-pizza",
        productName: "Cheese Pizza",
        variantId: "variant-large",
        variantName: "Large",
        quantity: 1,
        unitPrice: 14,
        configuredLineTotal: 14,
        componentPricingMode: "fixed_price",
        componentFixedPrice: 24.99,
        componentBasePrice: 24.99,
        childExtraTotal: 2,
        modifiers: [],
      },
    })

    expect(parentPayload).toMatchObject({
      product_id: null,
      product_name_snapshot: "Family Deal",
      relationship_type: "deal",
      line_subtotal: 26.99,
      notes: JSON.stringify({
        specialId: "deal-1",
        specialType: "orderable_deal",
        dealName: "Family Deal",
        selectedQuantity: null,
        mixUnitPrice: null,
        mixBaseTotal: null,
        usesComponentPricing: true,
        dealBasePrice: 24.99,
        componentBaseTotal: 24.99,
        childExtraTotal: 2,
        total: 26.99,
        componentPricingSummaries: [
          {
            componentId: "component-1",
            label: "Choose a pizza",
            pricingMode: "fixed_price",
            fixedPrice: 24.99,
            componentBaseTotal: 24.99,
          },
        ],
      }),
    })
    expect(childPayload).toMatchObject({
      parent_order_item_id: "parent-item-1",
      relationship_type: "deal_component",
      product_id: "product-pizza",
      product_name_snapshot: "Cheese Pizza",
      line_subtotal: 2,
      notes: JSON.stringify({
        componentId: "component-1",
        componentLabel: "Choose a pizza",
        specialType: "deal_component",
        componentPricingMode: "fixed_price",
        componentFixedPrice: 24.99,
        componentBasePrice: 24.99,
        childExtraTotal: 2,
        configuredLineTotal: 14,
      }),
    })
  })

  it("builds order discount insert payloads with mapped order item ids", () => {
    const payload = buildOrderDiscountInsertPayload({
      orderId: "order-1",
      orderItemIdsByLineId: new Map([["cart-1", "order-item-1"]]),
      discounts: [
        {
          lineId: "cart-1",
          orderItemId: null,
          businessId: "business-1",
          specialId: "special-1",
          nameSnapshot: "Pizza Special",
          specialTypeSnapshot: "line_discount",
          discountTypeSnapshot: "percentage",
          discountValueSnapshot: 10,
          amount: 3.9,
          couponCodeSnapshot: null,
        },
      ],
    })

    expect(payload).toEqual([
      {
        business_id: "business-1",
        order_id: "order-1",
        order_item_id: "order-item-1",
        special_id: "special-1",
        name_snapshot: "Pizza Special",
        special_type_snapshot: "line_discount",
        discount_type_snapshot: "percentage",
        discount_value_snapshot: 10,
        amount: 3.9,
        coupon_code_snapshot: null,
      },
    ])
  })

  it("builds cart-level order discount payloads with null order item id", () => {
    const payload = buildOrderDiscountInsertPayload({
      orderId: "order-1",
      orderItemIdsByLineId: new Map(),
      discounts: [
        {
          lineId: null,
          orderItemId: null,
          businessId: "business-1",
          specialId: "special-2",
          nameSnapshot: "Cart Special",
          specialTypeSnapshot: "cart_discount",
          discountTypeSnapshot: "fixed_amount",
          discountValueSnapshot: 5,
          amount: 5,
          couponCodeSnapshot: null,
        },
      ],
    })

    expect(payload[0].order_item_id).toBeNull()
  })

  it("throws when a line discount cannot be mapped to an inserted order item", () => {
    expect(() =>
      buildOrderDiscountInsertPayload({
        orderId: "order-1",
        orderItemIdsByLineId: new Map(),
        discounts: [
          {
            lineId: "missing-line",
            orderItemId: null,
            businessId: "business-1",
            specialId: "special-1",
            nameSnapshot: "Pizza Special",
            specialTypeSnapshot: "line_discount",
            discountTypeSnapshot: "percentage",
            discountValueSnapshot: 10,
            amount: 3.9,
            couponCodeSnapshot: null,
          },
        ],
      })
    ).toThrow(/map line discount/i)
  })
})
