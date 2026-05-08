"use client"

import { ThemedButton } from "@/components/themed/ThemedButton"
import { useCart } from "@/features/cart/context/CartProvider"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

export function CartSummaryBar() {
  const { items, itemCount, subtotal, removeItem, clearCart } = useCart()

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

        <Sheet>
          <SheetTrigger asChild>
            <ThemedButton>View Cart</ThemedButton>
          </SheetTrigger>

          <SheetContent className="flex w-full flex-col sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Your Cart</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.cartItemId} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{item.productName}</h3>

                        {item.variantName ? (
                          <p className="text-sm text-muted-foreground">
                            {item.variantName}
                          </p>
                        ) : null}
                      </div>

                      <p className="font-semibold">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>

                    {item.modifiers.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {item.modifiers.map((modifier) => (
                          <div
                            key={`${item.cartItemId}-${modifier.optionId}`}
                            className="text-sm text-muted-foreground"
                          >
                            <span className="font-medium text-foreground">
                              {modifier.groupName}:
                            </span>{" "}
                            {modifier.optionName}
                            {modifier.placement !== "whole"
                              ? ` (${modifier.placement})`
                              : ""}
                            {modifier.multiplier > 1
                              ? ` x${modifier.multiplier}`
                              : ""}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(item.cartItemId)}
                        className="text-sm font-medium text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="grid gap-2">
                <ThemedButton className="h-11 w-full">
                  Continue to Checkout
                </ThemedButton>

                <ThemedButton
                  type="button"
                  variant="outline"
                  className="h-11 w-full"
                  onClick={clearCart}
                >
                  Clear Cart
                </ThemedButton>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}