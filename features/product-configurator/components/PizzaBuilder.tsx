"use client"

import { useMemo, useState } from "react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Variant = {
  id: string
  name: string
  base_price: number
  is_default: boolean
  sort_order: number
}

type ModifierOption = {
  id: string
  name: string
  price_delta: number
  sort_order: number
}

type ModifierGroup = {
  id: string
  name: string
  selection_type: string
  is_required: boolean
  min_required: number
  max_allowed: number | null
  supports_placement: boolean
  supports_multiplier: boolean
  min_multiplier: number
  max_multiplier: number
  multiplier_step: number
  modifier_options: ModifierOption[]
}

type ProductModifierGroup = {
  id: string
  sort_order: number
  modifier_groups: ModifierGroup
}

type ProductConfig = {
  id: string
  name: string
  description: string | null
  base_price: number | null
  product_variants: Variant[]
  product_modifier_groups: ProductModifierGroup[]
}

type SelectedModifier = {
  optionId: string
  placement: "left" | "whole" | "right"
  multiplier: number
}

type PizzaBuilderProps = {
  product: ProductConfig
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PizzaBuilder({
  product,
  open,
  onOpenChange,
}: PizzaBuilderProps) {
  const sortedVariants = useMemo(
    () =>
      [...(product.product_variants ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    [product.product_variants]
  )

  const defaultVariant =
    sortedVariants.find((variant) => variant.is_default) ?? sortedVariants[0]

  const [variantId, setVariantId] = useState(defaultVariant?.id ?? "")
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, SelectedModifier>
  >({})

  const selectedVariant = sortedVariants.find(
    (variant) => variant.id === variantId
  )

  const modifierGroups = useMemo(
    () =>
      [...(product.product_modifier_groups ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => item.modifier_groups),
    [product.product_modifier_groups]
  )

  const total = useMemo(() => {
    const base = selectedVariant?.base_price ?? product.base_price ?? 0

    const modifierTotal = Object.values(selectedModifiers).reduce(
      (sum, selected) => {
        const option = modifierGroups
          .flatMap((group) => group.modifier_options)
          .find((modifierOption) => modifierOption.id === selected.optionId)

        if (!option) return sum

        return sum + Number(option.price_delta) * selected.multiplier
      },
      0
    )

    return base + modifierTotal
  }, [selectedVariant, product.base_price, selectedModifiers, modifierGroups])

  function toggleModifier(option: ModifierOption) {
    setSelectedModifiers((current) => {
      if (current[option.id]) {
        const copy = { ...current }
        delete copy[option.id]
        return copy
      }

      return {
        ...current,
        [option.id]: {
          optionId: option.id,
          placement: "whole",
          multiplier: 1,
        },
      }
    })
  }

  function updateModifier(
    optionId: string,
    updates: Partial<SelectedModifier>
  ) {
    setSelectedModifiers((current) => ({
      ...current,
      [optionId]: {
        ...current[optionId],
        ...updates,
      },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] max-w-3xl flex-col p-0 sm:h-auto sm:max-h-[90vh]">
        <DialogHeader className="border-b px-4 py-4">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <ThemedCard className="p-4">
            <h3 className="mb-3 text-lg font-semibold">Choose Your Size</h3>

            <RadioGroup value={variantId} onValueChange={setVariantId}>
              <div className="space-y-2">
                {sortedVariants.map((variant) => (
                  <Label
                    key={variant.id}
                    className="flex min-h-12 cursor-pointer items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={variant.id} />
                      <span className="font-medium">{variant.name}</span>
                    </div>

                    <span className="text-sm font-semibold">
                      ${Number(variant.base_price).toFixed(2)}
                    </span>
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </ThemedCard>

          {modifierGroups.map((group) => (
            <ThemedCard key={group.id} className="p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  {group.max_allowed ? (
                    <p className="text-sm text-muted-foreground">
                      Choose up to {group.max_allowed}.
                    </p>
                  ) : null}
                </div>

                {group.is_required ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Required
                  </span>
                ) : null}
              </div>

              <div className="space-y-3">
                {[...(group.modifier_options ?? [])]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((option) => {
                    const selected = selectedModifiers[option.id]

                    return (
                      <div
                        key={option.id}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => toggleModifier(option)}
                            className="text-left font-medium"
                          >
                            {selected ? "✓ " : ""}
                            {option.name}
                          </button>

                          {Number(option.price_delta) > 0 ? (
                            <span className="text-sm font-semibold">
                              +${Number(option.price_delta).toFixed(2)}
                            </span>
                          ) : null}
                        </div>

                        {selected && group.supports_placement ? (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {(["left", "whole", "right"] as const).map(
                              (placement) => (
                                <button
                                  key={placement}
                                  type="button"
                                  onClick={() =>
                                    updateModifier(option.id, { placement })
                                  }
                                  className={`rounded-md border px-3 py-2 text-sm capitalize ${
                                    selected.placement === placement
                                      ? "bg-primary text-primary-foreground"
                                      : ""
                                  }`}
                                >
                                  {placement}
                                </button>
                              )
                            )}
                          </div>
                        ) : null}

                        {selected && group.supports_multiplier ? (
                          <div className="mt-3">
                            <Label className="text-sm">Amount</Label>
                            <select
                              value={selected.multiplier}
                              onChange={(event) =>
                                updateModifier(option.id, {
                                  multiplier: Number(event.target.value),
                                })
                              }
                              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
                            >
                              {Array.from(
                                { length: Number(group.max_multiplier) },
                                (_, index) => index + 1
                              ).map((amount) => (
                                <option key={amount} value={amount}>
                                  {amount}x
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
              </div>
            </ThemedCard>
          ))}
        </div>

        <div className="border-t bg-background p-4">
          <ThemedButton className="h-12 w-full justify-between text-base">
            <span>Add to cart</span>
            <span>${total.toFixed(2)}</span>
          </ThemedButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}