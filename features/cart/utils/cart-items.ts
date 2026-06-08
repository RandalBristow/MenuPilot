import type {
  CartItem,
  CartModifier,
  ConfiguredCartItem,
  DealCartChildItem,
  DealCartComponent,
  DealCartItem,
} from "@/features/cart/types/cart"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableString(value: unknown) {
  return (
    typeof value === "string" || value === null || value === undefined
  )
}

function isNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
}

export function isCartModifier(value: unknown): value is CartModifier {
  if (!isRecord(value)) return false

  return (
    typeof value.optionId === "string" &&
    typeof value.optionName === "string" &&
    typeof value.groupId === "string" &&
    typeof value.groupName === "string" &&
    (value.placement === "left" ||
      value.placement === "whole" ||
      value.placement === "right") &&
    isNumber(value.multiplier) &&
    isNumber(value.priceDelta)
  )
}

export function isConfiguredCartItem(
  value: unknown
): value is ConfiguredCartItem {
  if (!isRecord(value)) return false

  return (
    (value.itemType === "configured" || value.itemType === undefined) &&
    typeof value.cartItemId === "string" &&
    isNullableString(value.businessId) &&
    isNullableString(value.businessSlug) &&
    isNullableString(value.locationId) &&
    isNullableString(value.locationSlug) &&
    typeof value.productId === "string" &&
    typeof value.productName === "string" &&
    (typeof value.variantId === "string" || value.variantId === null) &&
    (typeof value.variantName === "string" || value.variantName === null) &&
    isNumber(value.quantity) &&
    isNumber(value.unitPrice) &&
    isNumber(value.totalPrice) &&
    Array.isArray(value.modifiers) &&
    value.modifiers.every(isCartModifier)
  )
}

export function isDealCartChildItem(
  value: unknown
): value is DealCartChildItem {
  if (!isRecord(value)) return false

  return (
    typeof value.childLineId === "string" &&
    typeof value.productId === "string" &&
    typeof value.productName === "string" &&
    (typeof value.variantId === "string" || value.variantId === null) &&
    (typeof value.variantName === "string" || value.variantName === null) &&
    isNumber(value.quantity) &&
    (isNumber(value.configuredLineTotal) ||
      value.configuredLineTotal === null) &&
    isNumber(value.childExtraTotal) &&
    Array.isArray(value.modifiers) &&
    value.modifiers.every(isCartModifier)
  )
}

export function isDealCartComponent(
  value: unknown
): value is DealCartComponent {
  if (!isRecord(value)) return false

  return (
    typeof value.componentId === "string" &&
    typeof value.componentLabel === "string" &&
    isNumber(value.sortOrder) &&
    isNumber(value.requiredQuantity) &&
    isNumber(value.selectedQuantity) &&
    Array.isArray(value.children) &&
    value.children.every(isDealCartChildItem)
  )
}

export function isDealCartItem(value: unknown): value is DealCartItem {
  if (!isRecord(value)) return false

  return (
    value.itemType === "deal" &&
    typeof value.cartItemId === "string" &&
    isNullableString(value.businessId) &&
    isNullableString(value.businessSlug) &&
    isNullableString(value.locationId) &&
    isNullableString(value.locationSlug) &&
    typeof value.specialId === "string" &&
    typeof value.specialName === "string" &&
    isNumber(value.dealBasePrice) &&
    isNumber(value.childExtraTotal) &&
    isNumber(value.totalPrice) &&
    Array.isArray(value.components) &&
    value.components.every(isDealCartComponent)
  )
}

export function isCartItem(value: unknown): value is CartItem {
  return isConfiguredCartItem(value) || isDealCartItem(value)
}

export function getCartItemSubtotal(item: CartItem) {
  return item.totalPrice
}

export function getCartItemCountValue(item: CartItem) {
  return isDealCartItem(item) ? 1 : item.quantity
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + getCartItemSubtotal(item), 0)
}

export function getCartItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + getCartItemCountValue(item), 0)
}
