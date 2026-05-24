import type { CartItem } from "@/features/cart/types/cart"

export function getCartItemDisplaySnapshot(item: CartItem) {
  return {
    productName: item.productName,
    variantName: item.variantName,
    modifierNames: item.modifiers.map((modifier) => modifier.optionName),
  }
}
