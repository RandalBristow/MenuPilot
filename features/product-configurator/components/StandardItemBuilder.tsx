"use client"

import { useMemo, useState } from "react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { calculateProductTotal } from "@/lib/pricing/calculate-product-total"
import { useCart } from "@/features/cart/context/CartProvider"
import type { CartItem, CartModifier } from "@/features/cart/types/cart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ProductConfig } from "./PizzaBuilder"

type ModifierGroup =
  ProductConfig["product_modifier_groups"][number]["modifier_groups"]

type ModifierOption = ModifierGroup["modifier_options"][number]

type SelectedModifier = {
  optionId: string
  placement: "left" | "whole" | "right"
  multiplier: number
}

type StandardItemBuilderProps = {
  product: ProductConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  cartItem?: CartItem | null
}

function getInitialSelectedModifiers(cartItem?: CartItem | null) {
  if (!cartItem) return {}

  return cartItem.modifiers.reduce<Record<string, SelectedModifier>>(
    (selectedModifiers, modifier) => ({
      ...selectedModifiers,
      [modifier.optionId]: {
        optionId: modifier.optionId,
        placement: modifier.placement,
        multiplier: modifier.multiplier,
      },
    }),
    {}
  )
}

function getInitialQuantity(cartItem?: CartItem | null) {
  return cartItem?.quantity ?? 1
}

function getSelectedOptionsForGroup(
  group: ModifierGroup,
  selectedModifiers: Record<string, SelectedModifier>
) {
  return Object.values(selectedModifiers).filter((selected) =>
    group.modifier_options.some((option) => option.id === selected.optionId)
  )
}

export function StandardItemBuilder({
  product,
  open,
  onOpenChange,
  mode,
  cartItem = null,
}: StandardItemBuilderProps) {
  const sortedVariants = useMemo(
    () =>
      [...(product.product_variants ?? [])].sort(
        (first, second) => first.sort_order - second.sort_order
      ),
    [product.product_variants]
  )

  const defaultVariant =
    sortedVariants.find((variant) => variant.is_default) ?? sortedVariants[0]

  const [variantId, setVariantId] = useState(
    cartItem?.variantId ?? defaultVariant?.id ?? ""
  )
  const [quantity, setQuantity] = useState(getInitialQuantity(cartItem))
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, SelectedModifier>
  >(() => getInitialSelectedModifiers(cartItem))

  const { addItem, updateItem } = useCart()

  const selectedVariant = sortedVariants.find(
    (variant) => variant.id === variantId
  )

  const modifierGroups = useMemo(
    () =>
      [...(product.product_modifier_groups ?? [])]
        .sort((first, second) => first.sort_order - second.sort_order)
        .map((item) => {
          const group = item.modifier_groups
          const includedRule = product.product_included_modifier_groups?.find(
            (rule) => rule.modifier_group_id === group.id
          )

          return {
            ...group,
            included_quantity: includedRule
              ? Number(includedRule.included_quantity)
              : 0,
            is_swappable: includedRule?.is_swappable ?? false,
            charge_for_extra: includedRule?.charge_for_extra ?? true,
          }
        }),
    [product.product_modifier_groups, product.product_included_modifier_groups]
  )

  const unitTotal = useMemo(() => {
    const basePrice = selectedVariant?.base_price ?? product.base_price ?? 0

    return calculateProductTotal({
      basePrice,
      modifierGroups,
      selectedModifiers,
    })
  }, [modifierGroups, product.base_price, selectedModifiers, selectedVariant])

  const total = unitTotal * quantity

  function toggleModifier(group: ModifierGroup, option: ModifierOption) {
    setSelectedModifiers((current) => {
      if (current[option.id]) {
        const nextSelected = { ...current }
        delete nextSelected[option.id]
        return nextSelected
      }

      const selectedInGroup = getSelectedOptionsForGroup(group, current)

      if (group.selection_type === "single" && selectedInGroup.length > 0) {
        const nextSelected = { ...current }
        selectedInGroup.forEach((selected) => {
          delete nextSelected[selected.optionId]
        })

        return {
          ...nextSelected,
          [option.id]: {
            optionId: option.id,
            placement: "whole",
            multiplier: 1,
          },
        }
      }

      if (group.max_allowed && selectedInGroup.length >= group.max_allowed) {
        return current
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

  function getGroupValidationMessage(group: ModifierGroup) {
    const selectedCount = getSelectedOptionsForGroup(
      group,
      selectedModifiers
    ).length

    if (group.is_required && selectedCount < group.min_required) {
      return `Please choose at least ${group.min_required}.`
    }

    if (group.max_allowed && selectedCount > group.max_allowed) {
      return `Please choose no more than ${group.max_allowed}.`
    }

    return null
  }

  const validationMessages = modifierGroups
    .map((group) => ({
      groupId: group.id,
      groupName: group.name,
      message: getGroupValidationMessage(group),
    }))
    .filter((item) => item.message)

  const canSubmit = validationMessages.length === 0

  function getCartModifiers() {
    return Object.values(selectedModifiers)
      .map((selected) => {
        const group = modifierGroups.find((modifierGroup) =>
          modifierGroup.modifier_options.some(
            (option) => option.id === selected.optionId
          )
        )
        const option = group?.modifier_options.find(
          (modifierOption) => modifierOption.id === selected.optionId
        )

        if (!group || !option) return null

        return {
          optionId: option.id,
          optionName: option.name,
          groupId: group.id,
          groupName: group.name,
          placement: selected.placement,
          multiplier: selected.multiplier,
          priceDelta: Number(option.price_delta),
        }
      })
      .filter(Boolean) as CartModifier[]
  }

  function handleSubmit() {
    if (!canSubmit) return

    const nextCartItem: CartItem = {
      cartItemId: cartItem?.cartItemId ?? crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      quantity,
      unitPrice: unitTotal,
      totalPrice: total,
      modifiers: getCartModifiers(),
    }

    if (mode === "edit" && cartItem) {
      updateItem(cartItem.cartItemId, nextCartItem)
    } else {
      addItem(nextCartItem)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] max-w-2xl flex-col p-0 sm:h-auto sm:max-h-[90vh]">
        <DialogHeader className="border-b px-4 py-4">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {product.description ? (
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          {sortedVariants.length > 0 ? (
            <ThemedCard className="p-4">
              <h3 className="mb-3 text-lg font-semibold">Choose an option</h3>
              <div className="grid gap-2">
                {sortedVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setVariantId(variant.id)}
                    className={`flex min-h-12 items-center justify-between rounded-lg border p-3 text-left ${
                      variantId === variant.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <span className="font-medium">{variant.name}</span>
                    <span className="text-sm font-semibold">
                      ${Number(variant.base_price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </ThemedCard>
          ) : null}

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
                  className="h-10 w-10 bg-transparent text-foreground hover:bg-muted"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                >
                  -
                </ThemedButton>
                <span className="min-w-10 text-center font-semibold">
                  {quantity}
                </span>
                <ThemedButton
                  type="button"
                  variant="ghost"
                  className="h-10 w-10 bg-transparent text-foreground hover:bg-muted"
                  onClick={() => setQuantity((current) => current + 1)}
                >
                  +
                </ThemedButton>
              </div>
            </div>
          </ThemedCard>

          {modifierGroups.map((group) => (
            <ThemedCard key={group.id} className="p-4">
              <div className="mb-3 flex items-start justify-between gap-4">
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

              {getGroupValidationMessage(group) ? (
                <p className="mb-3 text-sm text-destructive">
                  {getGroupValidationMessage(group)}
                </p>
              ) : null}

              <div className="grid gap-2">
                {[...group.modifier_options]
                  .sort((first, second) => first.sort_order - second.sort_order)
                  .map((option) => {
                    const selected = selectedModifiers[option.id]

                    return (
                      <div key={option.id} className="rounded-lg border p-3">
                        <button
                          type="button"
                          onClick={() => toggleModifier(group, option)}
                          className="flex w-full items-center justify-between gap-3 text-left"
                        >
                          <span className="font-medium">
                            {selected ? "Selected: " : ""}
                            {option.name}
                          </span>
                          {Number(option.price_delta) > 0 ? (
                            <span className="text-sm font-semibold">
                              +${Number(option.price_delta).toFixed(2)}
                            </span>
                          ) : null}
                        </button>

                        {selected && group.supports_multiplier ? (
                          <div className="mt-3">
                            <label className="text-sm font-medium">
                              Amount
                            </label>
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
          {validationMessages.length > 0 ? (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-semibold">Please finish your selections:</p>
              <ul className="mt-1 list-inside list-disc">
                {validationMessages.map((item) => (
                  <li key={item.groupId}>
                    {item.groupName}: {item.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <ThemedButton
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="h-12 w-full justify-between text-base"
          >
            <span>{mode === "edit" ? "Save changes" : "Add to cart"}</span>
            <span>${total.toFixed(2)}</span>
          </ThemedButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
