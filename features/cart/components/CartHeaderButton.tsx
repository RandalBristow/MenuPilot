"use client"

import { ShoppingCart } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { useCart } from "@/features/cart/context/CartProvider"
import { CartSheet } from "@/features/cart/components/CartSheet"

export function CartHeaderButton() {
  const { itemCount } = useCart()

  return (
    <CartSheet
      trigger={
        <ThemedButton
          type="button"
          variant="outline"
          size="icon"
          className="relative bg-background text-foreground hover:bg-muted"
          aria-label={`Open cart, ${itemCount} ${
            itemCount === 1 ? "item" : "items"
          }`}
        >
          <ShoppingCart aria-hidden="true" />
          <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
            {itemCount}
          </span>
        </ThemedButton>
      }
    />
  )
}
