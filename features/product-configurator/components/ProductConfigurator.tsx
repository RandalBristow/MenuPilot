"use client"

import type { CartItem } from "@/features/cart/types/cart"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getProductBuilderRoute } from "@/features/product-configurator/utils/builder-templates"
import { PizzaBuilder, type ProductConfig } from "./PizzaBuilder"
import { StandardItemBuilder } from "./StandardItemBuilder"

type ProductConfiguratorProps = {
  product: ProductConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  cartItem?: CartItem | null
}

export type { ProductConfig }

export function ProductConfigurator({
  product,
  open,
  onOpenChange,
  mode,
  cartItem = null,
}: ProductConfiguratorProps) {
  const builderRoute = getProductBuilderRoute(product.builder_template)

  if (builderRoute === "pizza") {
    return (
      <PizzaBuilder
        key={`${product.id}-${mode}-${cartItem?.cartItemId ?? "new"}`}
        product={product}
        open={open}
        onOpenChange={onOpenChange}
        editingCartItem={mode === "edit" ? cartItem : null}
      />
    )
  }

  if (builderRoute === "unsupported") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This product type is not available in online ordering yet.
            </p>
            <div className="flex justify-end">
              <ThemedButton type="button" onClick={() => onOpenChange(false)}>
                Close
              </ThemedButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <StandardItemBuilder
      key={`${product.id}-${mode}-${cartItem?.cartItemId ?? "new"}`}
      product={product}
      open={open}
      onOpenChange={onOpenChange}
      mode={mode}
      cartItem={cartItem}
    />
  )
}
