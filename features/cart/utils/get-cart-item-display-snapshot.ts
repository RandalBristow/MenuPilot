import type { CartItem } from "@/features/cart/types/cart"
import { isDealCartItem } from "@/features/cart/utils/cart-items"

export function getCartItemDisplaySnapshot(item: CartItem) {
  if (isDealCartItem(item)) {
    return {
      productName: item.specialName,
      variantName: null,
      modifierNames: item.components.flatMap((component) =>
        component.children.flatMap((child) =>
          child.modifiers.map((modifier) => modifier.optionName)
        )
      ),
    }
  }

  return {
    productName: item.productName,
    variantName: item.variantName,
    modifierNames: item.modifiers.map((modifier) => modifier.optionName),
  }
}
