import type { CartItem, CartModifier } from "@/features/cart/types/cart"

export type BuildOrderPayloadInput = {
  businessId: string
  locationId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  fulfillmentType: "pickup" | "delivery"
  specialInstructions?: string
  items: CartItem[]
}

export function getOrderSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.totalPrice, 0)
}

export function buildOrderInsertPayload({
  businessId,
  locationId,
  orderNumber,
  customerName,
  customerPhone,
  customerEmail,
  fulfillmentType,
  specialInstructions,
  items,
}: BuildOrderPayloadInput) {
  const subtotal = getOrderSubtotal(items)

  return {
    business_id: businessId,
    location_id: locationId,
    order_number: orderNumber,
    customer_name: customerName.trim(),
    customer_email: customerEmail?.trim() || null,
    customer_phone: customerPhone.trim(),
    fulfillment_type: fulfillmentType,
    order_status: "new",
    payment_status: "unpaid",
    subtotal,
    discount_total: 0,
    tax_total: 0,
    tip_total: 0,
    charge_total: 0,
    delivery_fee: 0,
    total: subtotal,
    special_instructions: specialInstructions?.trim() || null,
  }
}

export function buildOrderItemInsertPayload({
  businessId,
  orderId,
  item,
}: {
  businessId: string
  orderId: string
  item: CartItem
}) {
  return {
    business_id: businessId,
    order_id: orderId,
    product_id: item.productId,
    variant_group_option_id: item.variantId,
    product_name_snapshot: item.productName,
    variant_name_snapshot: item.variantName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_subtotal: item.totalPrice,
  }
}

export function buildOrderModifierInsertPayload({
  businessId,
  orderItemId,
  modifiers,
}: {
  businessId: string
  orderItemId: string
  modifiers: CartModifier[]
}) {
  return modifiers.map((modifier) => ({
    business_id: businessId,
    order_item_id: orderItemId,
    modifier_group_id: modifier.groupId,
    modifier_option_id: modifier.optionId,
    group_name_snapshot: modifier.groupName,
    option_name_snapshot: modifier.optionName,
    placement: modifier.placement,
    multiplier: modifier.multiplier,
    price_delta: modifier.priceDelta,
    quantity: 1,
  }))
}
