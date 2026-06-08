import type {
  ConfiguredCartItem,
  ConfiguredProductResult,
} from "@/features/cart/types/cart"

export type ProductConfiguratorSubmitBehavior = "cart" | "return"

type SubmitConfiguredProductResultInput = {
  submitBehavior?: ProductConfiguratorSubmitBehavior
  mode: "create" | "edit"
  result: ConfiguredProductResult
  existingCartItem?: ConfiguredCartItem | null
  onConfiguredItem?: (result: ConfiguredProductResult) => void
  addItem: (item: ConfiguredCartItem) => void
  updateItem: (cartItemId: string, updatedItem: ConfiguredCartItem) => void
  createCartItemId?: () => string
}

export function submitConfiguredProductResult({
  submitBehavior = "cart",
  mode,
  result,
  existingCartItem = null,
  onConfiguredItem,
  addItem,
  updateItem,
  createCartItemId = () => crypto.randomUUID(),
}: SubmitConfiguredProductResultInput): {
  ok: boolean
  cartItem: ConfiguredCartItem | null
} {
  if (submitBehavior === "return") {
    if (!onConfiguredItem) {
      console.warn(
        "ProductConfigurator return mode submitted without onConfiguredItem."
      )
      return { ok: false, cartItem: null }
    }

    onConfiguredItem(result)
    return { ok: true, cartItem: null }
  }

  const cartItem: ConfiguredCartItem = {
    cartItemId: existingCartItem?.cartItemId ?? createCartItemId(),
    ...result,
  }

  if (mode === "edit" && existingCartItem) {
    updateItem(existingCartItem.cartItemId, cartItem)
  } else {
    addItem(cartItem)
  }

  return { ok: true, cartItem }
}
