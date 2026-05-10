"use client"

import type { CartItem } from "@/features/cart/types/cart"
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
    <StandardItemBuilder
      product={product}
      open={open}
      onOpenChange={onOpenChange}
      mode={mode}
      cartItem={cartItem}
    />
  )
}
