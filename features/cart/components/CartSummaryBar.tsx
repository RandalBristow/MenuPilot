"use client"

import { ThemedButton } from "@/components/themed/ThemedButton"
import { useCart } from "@/features/cart/context/CartProvider"

export function CartSummaryBar() {
  const { itemCount, subtotal } = useCart()

  if (itemCount === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="font-semibold">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
          <p className="text-sm text-muted-foreground">
            Subtotal: ${subtotal.toFixed(2)}
          </p>
        </div>

        <ThemedButton>View Cart</ThemedButton>
      </div>
    </div>
  )
}