import type {
  CartModifier,
  ConfiguredCartItem,
  ConfiguredProductResult,
} from "@/features/cart/types/cart"

export type CartItemVariantSnapshot = {
  id: string
  name: string
  base_price: number
} | null

export type BuildCartItemInput = {
  cartItemId: string
} & BuildConfiguredProductResultInput

export type BuildConfiguredProductResultInput = {
  businessId?: string | null
  businessSlug?: string | null
  locationId?: string | null
  locationSlug?: string | null
  productId: string
  productName: string
  selectedVariant: CartItemVariantSnapshot
  quantity: number
  unitPrice: number
  configuredLineTotal?: number
  chargedModifierTotal?: number
  modifierExtraTotal?: number
  childExtraTotal?: number
  modifiers: CartModifier[]
}

export function buildConfiguredProductResult({
  businessId,
  businessSlug,
  locationId,
  locationSlug,
  productId,
  productName,
  selectedVariant,
  quantity,
  unitPrice,
  configuredLineTotal,
  chargedModifierTotal,
  modifierExtraTotal,
  childExtraTotal,
  modifiers,
}: BuildConfiguredProductResultInput): ConfiguredProductResult {
  const totalPrice = unitPrice * quantity

  return {
    businessId,
    businessSlug,
    locationId,
    locationSlug,
    productId,
    productName,
    variantId: selectedVariant?.id ?? null,
    variantName: selectedVariant?.name ?? null,
    quantity,
    unitPrice,
    totalPrice,
    configuredLineTotal: configuredLineTotal ?? totalPrice,
    chargedModifierTotal,
    modifierExtraTotal,
    childExtraTotal,
    modifiers,
  }
}

export function buildConfiguredCartItem({
  cartItemId,
  ...input
}: BuildCartItemInput): ConfiguredCartItem {
  return {
    cartItemId,
    ...buildConfiguredProductResult(input),
  }
}
