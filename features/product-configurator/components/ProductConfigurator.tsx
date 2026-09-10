"use client"

import type {
  ConfiguredCartItem,
  ConfiguredProductResult,
} from "@/features/cart/types/cart"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { resolveProductBuilderMode } from "@/features/product-configurator/utils/resolve-product-builder-mode"
import type { ProductConfiguratorSubmitBehavior } from "@/features/product-configurator/utils/submit-configured-product-result"
import type { ModifierIncludedRuleOverride } from "@/features/product-configurator/utils/modifier-included-rule-overrides"
import type { DealComponentPricingContext } from "@/features/product-configurator/utils/deal-component-pricing-context"
import { GenericConfigurableBuilder } from "./GenericConfigurableBuilder"
import { PizzaBuilder, type ProductConfig } from "./PizzaBuilder"
import { SimpleProductBuilder } from "./SimpleProductBuilder"

type ProductConfiguratorProps = {
  product: ProductConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  cartItem?: ConfiguredCartItem | null
  businessSlug?: string | null
  submitBehavior?: ProductConfiguratorSubmitBehavior
  allowedVariantOptionIds?: string[] | null
  modifierIncludedRuleOverrides?: ModifierIncludedRuleOverride[] | null
  dealComponentPricingContext?: DealComponentPricingContext | null
  lockQuantity?: boolean
  onConfiguredItem?: (result: ConfiguredProductResult) => void
}

export type { ProductConfig }

export function ProductConfigurator({
  product,
  open,
  onOpenChange,
  mode,
  cartItem = null,
  businessSlug = null,
  submitBehavior = "cart",
  allowedVariantOptionIds = null,
  modifierIncludedRuleOverrides = null,
  dealComponentPricingContext = null,
  lockQuantity = false,
  onConfiguredItem,
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
        submitBehavior={submitBehavior}
        allowedVariantOptionIds={allowedVariantOptionIds}
        modifierIncludedRuleOverrides={modifierIncludedRuleOverrides}
        dealComponentPricingContext={dealComponentPricingContext}
        lockQuantity={lockQuantity}
        onConfiguredItem={onConfiguredItem}
      />
    )
  }

  if (builderMode === "unsupported") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              Combos and bundles are coming soon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
        submitBehavior={submitBehavior}
        allowedVariantOptionIds={allowedVariantOptionIds}
        modifierIncludedRuleOverrides={modifierIncludedRuleOverrides}
        dealComponentPricingContext={dealComponentPricingContext}
        lockQuantity={lockQuantity}
        onConfiguredItem={onConfiguredItem}
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
      submitBehavior={submitBehavior}
      allowedVariantOptionIds={allowedVariantOptionIds}
      modifierIncludedRuleOverrides={modifierIncludedRuleOverrides}
      dealComponentPricingContext={dealComponentPricingContext}
      lockQuantity={lockQuantity}
      onConfiguredItem={onConfiguredItem}
    />
  )
}
