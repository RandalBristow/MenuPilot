"use client"

import { useState, type ReactElement } from "react"
import Link from "next/link"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
  ThemedSheetTrigger,
} from "@/components/themed/ThemedSheet"
import { useCart } from "@/features/cart/context/CartProvider"
import type { CartItem, CartModifier } from "@/features/cart/types/cart"
import {
  ProductConfigurator,
  type ProductConfig,
} from "@/features/product-configurator/components/ProductConfigurator"
import { getProductConfig } from "@/features/product-configurator/queries/get-product-config"

type CartSheetProps = {
  trigger: ReactElement
}

type ModifierGroup = {
  groupId: string
  groupName: string
  modifiers: CartModifier[]
}

function groupModifiers(modifiers: CartModifier[]) {
  return modifiers.reduce<ModifierGroup[]>((groups, modifier) => {
    const group = groups.find((item) => item.groupId === modifier.groupId)

    if (group) {
      group.modifiers.push(modifier)
      return groups
    }

    return [
      ...groups,
      {
        groupId: modifier.groupId,
        groupName: modifier.groupName,
        modifiers: [modifier],
      },
    ]
  }, [])
}

function formatPlacement(placement: CartModifier["placement"]) {
  if (placement === "whole") return null

  return placement.charAt(0).toUpperCase() + placement.slice(1)
}

export function CartSheet({ trigger }: CartSheetProps) {
  const { items, subtotal, removeItem, clearCart } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [editingProduct, setEditingProduct] = useState<ProductConfig | null>(
    null
  )
  const [loadingEditItemId, setLoadingEditItemId] = useState<string | null>(
    null
  )
  const [editError, setEditError] = useState<string | null>(null)

  async function handleEditItem(item: CartItem) {
    if (loadingEditItemId) return

    setEditError(null)
    setLoadingEditItemId(item.cartItemId)

    try {
      const config = await getProductConfig(item.productId)

      setEditingProduct(config as unknown as ProductConfig)
      setEditingItem(item)
      setIsCartOpen(false)
    } catch (error) {
      console.error("Failed to load cart item config:", error)
      setEditError("Could not load this item. Please try again.")
    } finally {
      setLoadingEditItemId(null)
    }
  }

  function handleEditOpenChange(open: boolean) {
    if (open) return

    setEditingItem(null)
    setEditingProduct(null)
  }

  return (
    <>
      <ThemedSheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <ThemedSheetTrigger asChild>{trigger}</ThemedSheetTrigger>

        <ThemedSheetContent className="flex h-dvh w-full max-w-full flex-col gap-0 p-0 sm:max-w-md md:max-w-lg">
          <ThemedSheetHeader className="border-b px-4 py-4 pr-12">
            <ThemedSheetTitle>Your Cart</ThemedSheetTitle>
            <ThemedSheetDescription>
              Review your order before checkout.
            </ThemedSheetDescription>
          </ThemedSheetHeader>

          {editError ? (
            <p className="mx-4 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {editError}
            </p>
          ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed p-6 text-center">
              <div className="space-y-2">
                <p className="font-semibold">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">
                  Add a menu item and it will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <ThemedCard key={item.cartItemId} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold leading-tight">
                          {item.productName}
                        </h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Qty {item.quantity}
                        </span>
                      </div>

                      {item.variantName ? (
                        <p className="text-sm text-muted-foreground">
                          {item.variantName}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold leading-tight">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                      {item.quantity > 1 ? (
                        <p className="text-xs text-muted-foreground">
                          ${item.unitPrice.toFixed(2)} each
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {item.modifiers.length > 0 ? (
                    <div className="space-y-3 border-t pt-3">
                      {groupModifiers(item.modifiers).map((group) => (
                        <div key={group.groupId} className="border-l pl-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            {group.groupName}
                          </p>
                          <div className="mt-1 space-y-1">
                            {group.modifiers.map((modifier) => {
                              const placement = formatPlacement(
                                modifier.placement
                              )

                              return (
                                <div
                                  key={`${item.cartItemId}-${modifier.optionId}`}
                                  className="flex justify-between gap-3 text-sm"
                                >
                                  <span className="text-muted-foreground">
                                    {modifier.optionName}
                                    {placement ? ` (${placement})` : ""}
                                    {modifier.multiplier > 1
                                      ? ` x${modifier.multiplier}`
                                      : ""}
                                  </span>
                                  {modifier.priceDelta > 0 ? (
                                    <span className="shrink-0 text-muted-foreground">
                                      +${modifier.priceDelta.toFixed(2)}
                                    </span>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex justify-end border-t pt-3">
                    <ThemedButton
                      type="button"
                      variant="link"
                      onClick={() => handleEditItem(item)}
                      disabled={loadingEditItemId === item.cartItemId}
                      className="mr-4 h-auto bg-transparent p-0 text-sm font-medium text-foreground hover:bg-transparent"
                    >
                      {loadingEditItemId === item.cartItemId
                        ? "Loading..."
                        : "Edit"}
                    </ThemedButton>

                    <ThemedButton
                      type="button"
                      variant="link"
                      onClick={() => removeItem(item.cartItemId)}
                      className="h-auto bg-transparent p-0 text-sm font-medium text-destructive hover:bg-transparent"
                    >
                      Remove
                    </ThemedButton>
                  </div>
                </ThemedCard>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div className="space-y-4 border-t bg-background p-4">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="border-t" />

            <div className="grid gap-2">
              <ThemedButton asChild className="h-11 w-full">
                <Link href="/checkout">Continue to Checkout</Link>
              </ThemedButton>

              <ThemedButton
                type="button"
                variant="outline"
                className="h-11 w-full bg-background text-foreground hover:bg-muted"
                onClick={clearCart}
              >
                Clear Cart
              </ThemedButton>
            </div>
          </div>
        ) : null}
        </ThemedSheetContent>
      </ThemedSheet>

      {editingProduct && editingItem ? (
        <ProductConfigurator
          key={editingItem.cartItemId}
          product={editingProduct}
          open={Boolean(editingProduct && editingItem)}
          onOpenChange={handleEditOpenChange}
          mode="edit"
          cartItem={editingItem}
        />
      ) : null}
    </>
  )
}
