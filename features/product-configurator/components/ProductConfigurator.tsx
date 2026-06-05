"use client"

import type { CartItem } from "@/features/cart/types/cart"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { resolveProductBuilderMode } from "@/features/product-configurator/utils/resolve-product-builder-mode"
import { GenericConfigurableBuilder } from "./GenericConfigurableBuilder"
import { PizzaBuilder, type ProductConfig } from "./PizzaBuilder"
import { SimpleProductBuilder } from "./SimpleProductBuilder"

type ProductConfiguratorProps = {
  product: ProductConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  cartItem?: CartItem | null
  businessSlug?: string | null
}

export type { ProductConfig }

export function ProductConfigurator({
  product,
  open,
  onOpenChange,
  mode,
  cartItem = null,
  businessSlug = null,
}: ProductConfiguratorProps) {
  const builderMode = resolveProductBuilderMode(product)

  if (builderMode === "pizza") {
    return (
      <PizzaBuilder
        key={`${product.id}-${mode}-${cartItem?.cartItemId ?? "new"}`}
        product={product}
        open={open}
        onOpenChange={onOpenChange}
        editingCartItem={mode === "edit" ? cartItem : null}
        businessSlug={businessSlug}
      />
    )
  }

  if (builderMode === "unsupported") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Combos and bundles are coming soon.
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

  if (
    builderMode === "simple-variant" ||
    builderMode === "simple-quantity"
  ) {
    return (
      <SimpleProductBuilder
        key={`${product.id}-${mode}-${cartItem?.cartItemId ?? "new"}`}
        product={product}
        open={open}
        onOpenChange={onOpenChange}
        mode={mode}
        cartItem={cartItem}
        businessSlug={businessSlug}
      />
    )
  }

  return (
    <GenericConfigurableBuilder
      key={`${product.id}-${mode}-${cartItem?.cartItemId ?? "new"}`}
      product={product}
      open={open}
      onOpenChange={onOpenChange}
      mode={mode}
      cartItem={cartItem}
      businessSlug={businessSlug}
    />
  )
}
