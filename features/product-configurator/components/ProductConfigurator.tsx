"use client"

import { ThemedButton } from "@/components/themed/ThemedButton"
import type { CartItem } from "@/features/cart/types/cart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PizzaBuilder, type ProductConfig } from "./PizzaBuilder"

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
  if (product.builder_template === "pizza") {
    return (
      <PizzaBuilder
        product={product}
        open={open}
        onOpenChange={onOpenChange}
        editingCartItem={mode === "edit" ? cartItem : null}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This product configurator is not available yet.
          </p>

          <ThemedButton type="button" onClick={() => onOpenChange(false)}>
            Close
          </ThemedButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
