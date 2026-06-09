import type {
  ValidatedPricedCartItem,
  ValidatedPricedModifier,
} from "@/features/checkout/utils/validate-and-price-cart"
import type {
  ValidatedPricedCheckoutItem,
  ValidatedPricedDealChildItem,
  ValidatedPricedDealItem,
} from "@/features/checkout/utils/validate-and-price-checkout-items"
import type { AppliedSpecialDiscountSnapshot } from "@/features/specials/utils/apply-specials-to-priced-cart"

export type BuildOrderPayloadInput = {
  businessId: string
  locationId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  fulfillmentType: "pickup" | "delivery"
  specialInstructions?: string
  items: ValidatedPricedCheckoutItem[]
  discountTotal?: number
  total?: number
}

export function getOrderSubtotal(items: ValidatedPricedCheckoutItem[]) {
  return Math.round(
    (items.reduce((sum, item) => sum + item.lineSubtotal, 0) + Number.EPSILON) *
      100
  ) / 100
}

function isDealCheckoutItem(
  item: ValidatedPricedCheckoutItem
): item is ValidatedPricedDealItem {
  return "itemType" in item && item.itemType === "deal"
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
  discountTotal = 0,
  total,
}: BuildOrderPayloadInput) {
  const subtotal = getOrderSubtotal(items)
  const resolvedDiscountTotal = Math.max(0, discountTotal)

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
    discount_total: resolvedDiscountTotal,
    tax_total: 0,
    tip_total: 0,
    charge_total: 0,
    delivery_fee: 0,
    total: total ?? Math.max(0, subtotal - resolvedDiscountTotal),
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
  item: ValidatedPricedCartItem
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
    line_subtotal: item.lineSubtotal,
    relationship_type: null,
    parent_order_item_id: null,
  }
}

export function buildDealParentOrderItemInsertPayload({
  businessId,
  orderId,
  item,
}: {
  businessId: string
  orderId: string
  item: ValidatedPricedDealItem
}) {
  return {
    business_id: businessId,
    order_id: orderId,
    parent_order_item_id: null,
    relationship_type: "deal",
    product_id: null,
    variant_group_option_id: null,
    product_name_snapshot: item.specialName,
    variant_name_snapshot: null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_subtotal: item.lineSubtotal,
    notes: JSON.stringify({
      specialId: item.specialId,
      specialType: item.specialType,
      dealName: item.specialName,
      selectedQuantity: item.selectedQuantity ?? null,
      mixUnitPrice: item.mixUnitPrice ?? null,
      mixBaseTotal: item.mixBaseTotal ?? null,
      usesComponentPricing: item.usesComponentPricing ?? false,
      dealBasePrice: item.dealBasePrice,
      componentBaseTotal: item.componentBaseTotal ?? null,
      childExtraTotal: item.childExtraTotal,
      total: item.lineSubtotal,
      componentPricingSummaries: item.components.map((component) => ({
        componentId: component.componentId,
        label: component.label,
        pricingMode: component.pricingMode,
        fixedPrice: component.fixedPrice,
        componentBaseTotal: component.componentBaseTotal,
      })),
    }),
  }
}

export function buildDealChildOrderItemInsertPayload({
  businessId,
  orderId,
  parentOrderItemId,
  child,
}: {
  businessId: string
  orderId: string
  parentOrderItemId: string
  child: ValidatedPricedDealChildItem
}) {
  return {
    business_id: businessId,
    order_id: orderId,
    parent_order_item_id: parentOrderItemId,
    relationship_type: "deal_component",
    product_id: child.productId,
    variant_group_option_id: child.variantId,
    product_name_snapshot: child.productName,
    variant_name_snapshot: child.variantName,
    quantity: child.quantity,
    unit_price: child.quantity > 0 ? child.childExtraTotal / child.quantity : 0,
    line_subtotal: child.childExtraTotal,
    notes: JSON.stringify({
      componentId: child.componentId,
      componentLabel: child.componentLabel,
      specialType: "deal_component",
      componentPricingMode: child.componentPricingMode ?? null,
      componentFixedPrice: child.componentFixedPrice ?? null,
      componentBasePrice: child.componentBasePrice ?? null,
      childExtraTotal: child.childExtraTotal,
      configuredLineTotal: child.configuredLineTotal,
    }),
  }
}

export function getPassiveSpecialEligibleItems(
  items: ValidatedPricedCheckoutItem[]
): ValidatedPricedCartItem[] {
  return items.filter(
    (item): item is ValidatedPricedCartItem => !isDealCheckoutItem(item)
  )
}

export function buildOrderModifierInsertPayload({
  businessId,
  orderItemId,
  modifiers,
}: {
  businessId: string
  orderItemId: string
  modifiers: ValidatedPricedModifier[]
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

export function buildOrderDiscountInsertPayload({
  orderId,
  discounts,
  orderItemIdsByLineId,
}: {
  orderId: string
  discounts: AppliedSpecialDiscountSnapshot[]
  orderItemIdsByLineId: Map<string, string>
}) {
  return discounts.map((discount) => {
    const orderItemId = discount.lineId
      ? orderItemIdsByLineId.get(discount.lineId)
      : null

    if (discount.lineId && !orderItemId) {
      throw new Error("Could not map line discount to inserted order item.")
    }

    return {
      business_id: discount.businessId,
      order_id: orderId,
      order_item_id: orderItemId,
      special_id: discount.specialId,
      name_snapshot: discount.nameSnapshot,
      special_type_snapshot: discount.specialTypeSnapshot,
      discount_type_snapshot: discount.discountTypeSnapshot,
      discount_value_snapshot: discount.discountValueSnapshot,
      amount: discount.amount,
      coupon_code_snapshot: discount.couponCodeSnapshot,
    }
  })
}
