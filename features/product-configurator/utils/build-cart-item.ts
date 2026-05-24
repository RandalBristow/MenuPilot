import type { CartItem, CartModifier } from "@/features/cart/types/cart"

export type CartItemVariantSnapshot = {
  id: string
  name: string
  base_price: number
} | null

export type BuildCartItemInput = {
  cartItemId: string
  productId: string
  productName: string
  selectedVariant: CartItemVariantSnapshot
  quantity: number
  unitPrice: number
  modifiers: CartModifier[]
}

export function buildConfiguredCartItem({
  cartItemId,
  productId,
  productName,
  selectedVariant,
  quantity,
  unitPrice,
  modifiers,
}: BuildCartItemInput): CartItem {
  return {
    cartItemId,
    productId,
    productName,
    variantId: selectedVariant?.id ?? null,
    variantName: selectedVariant?.name ?? null,
    quantity,
    unitPrice,
    totalPrice: unitPrice * quantity,
    modifiers,
  }
}
