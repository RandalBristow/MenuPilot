"use client"

import { useMemo, useState } from "react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { priceConfiguredProduct } from "@/lib/pricing/price-configured-product"
import { useCart } from "@/features/cart/context/CartProvider"
import type { CartItem } from "@/features/cart/types/cart"
import { buildConfiguredCartItem } from "@/features/product-configurator/utils/build-cart-item"
import { getSafeInitialVariantId } from "@/features/product-configurator/utils/cart-safety"
import { filterEnabledProductVariants } from "@/features/product-configurator/utils/filter-enabled-product-variants"
import type { ProductConfig } from "./PizzaBuilder"

type SimpleProductBuilderProps = {
  product: ProductConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  cartItem?: CartItem | null
  businessSlug?: string | null
}

function getInitialQuantity(cartItem?: CartItem | null) {
  return cartItem?.quantity ?? 1
}

export function SimpleProductBuilder({
  product,
  open,
  onOpenChange,
  mode,
  cartItem = null,
  businessSlug = null,
}: SimpleProductBuilderProps) {
  const sortedVariants = useMemo(
    () => filterEnabledProductVariants(product.variants),
    [product.variants]
  )
  const [variantId, setVariantId] = useState(
    getSafeInitialVariantId(sortedVariants, cartItem?.variantId)
  )
  const [quantity, setQuantity] = useState(getInitialQuantity(cartItem))
  const { addItem, updateItem } = useCart()

  const selectedVariant = sortedVariants.find(
    (variant) => variant.id === variantId
  )
  const hasVariantChoices = product.has_variants || sortedVariants.length > 0
  const isVariantUnavailable = product.has_variants && sortedVariants.length === 0
  const pricing = useMemo(
    () =>
      priceConfiguredProduct({
        productBasePrice: product.base_price ?? 0,
        selectedVariant,
        selectedModifiers: {},
        modifierGroups: [],
        quantity,
      }),
    [product.base_price, quantity, selectedVariant]
  )
  const canSubmit = !isVariantUnavailable

  function handleSubmit() {
    if (!canSubmit) return

    const nextCartItem = buildConfiguredCartItem({
      cartItemId: cartItem?.cartItemId ?? crypto.randomUUID(),
      businessId: product.business_id ?? cartItem?.businessId,
      businessSlug: businessSlug ?? cartItem?.businessSlug,
      locationId: cartItem?.locationId,
      locationSlug: cartItem?.locationSlug,
      productId: product.id,
      productName: product.name,
      selectedVariant: selectedVariant
        ? {
            id: selectedVariant.id,
            name: selectedVariant.name,
            base_price: Number(selectedVariant.base_price),
          }
        : null,
      quantity,
      unitPrice: pricing.unitPrice,
      modifiers: [],
    })

    if (mode === "edit" && cartItem) {
      updateItem(cartItem.cartItemId, nextCartItem)
    } else {
      addItem(nextCartItem)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] max-h-[92dvh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:h-[min(90dvh,42rem)] sm:max-h-[90dvh]">
        <DialogHeader className="shrink-0 border-b px-4 py-4">
          <DialogTitle>{product.name}</DialogTitle>
          {product.description ? (
            <p className="text-sm leading-5 text-muted-foreground">
              {product.description}
            </p>
          ) : null}
        </DialogHeader>

        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <ThemedCard className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Quantity</h3>
                <p className="text-sm text-muted-foreground">
                  Choose how many to add.
                </p>
              </div>

              <div className="flex items-center rounded-lg border">
                <ThemedButton
                  type="button"
                  variant="ghost"
                  aria-label="Decrease quantity"
                  className="h-10 w-10 bg-transparent text-foreground hover:bg-muted"
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                >
                  -
                </ThemedButton>
                <span className="min-w-10 text-center font-semibold">
                  {quantity}
                </span>
                <ThemedButton
                  type="button"
                  variant="ghost"
                  aria-label="Increase quantity"
                  className="h-10 w-10 bg-transparent text-foreground hover:bg-muted"
                  onClick={() => setQuantity((current) => current + 1)}
                >
                  +
                </ThemedButton>
              </div>
            </div>
          </ThemedCard>

          {hasVariantChoices ? (
            <ThemedCard className="p-4">
              <h3 className="mb-3 text-lg font-semibold">Choose an option</h3>
              {isVariantUnavailable ? (
                <p className="text-sm text-muted-foreground">
                  This item is not currently available.
                </p>
              ) : (
                <div className="grid gap-2">
                  {sortedVariants.map((variant) => {
                    const isSelected = variant.id === variantId

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setVariantId(variant.id)}
                        className={`flex min-h-12 items-center justify-between rounded-lg border p-3 text-left ${
                          isSelected ? "border-accent bg-accent/20" : ""
                        }`}
                      >
                        <span className="font-medium">{variant.name}</span>
                        <span className="text-sm font-semibold">
                          ${Number(variant.base_price).toFixed(2)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </ThemedCard>
          ) : null}
        </div>

        <div className="shrink-0 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {isVariantUnavailable ? (
            <div className="mb-3 rounded-lg border p-3 text-sm text-muted-foreground">
              This item has no available variants right now.
            </div>
          ) : null}

          <ThemedButton
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="h-12 w-full justify-between text-base"
          >
            <span>{mode === "edit" ? "Save changes" : "Add to cart"}</span>
            <span>${pricing.lineTotal.toFixed(2)}</span>
          </ThemedButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
