"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { priceConfiguredProduct } from "@/lib/pricing/price-configured-product"
import { useCart } from "@/features/cart/context/CartProvider"
import type { CartItem, CartModifier } from "@/features/cart/types/cart"
import { getSafeInitialVariantId } from "@/features/product-configurator/utils/cart-safety"
import { filterEnabledModifierOptions } from "@/features/product-configurator/utils/filter-enabled-modifier-options"
import { filterEnabledProductVariants } from "@/features/product-configurator/utils/filter-enabled-product-variants"
import {
  filterModifierOptionsByVariant,
  removeUnavailableSelectedModifiers,
} from "@/features/product-configurator/utils/filter-modifier-options-by-variant"
import { applyVariantModifierOptionPrices } from "@/features/product-configurator/utils/variant-modifier-pricing"
import { getInitialSelectedModifiersFromDefaults } from "@/features/product-configurator/utils/product-default-modifiers"
import { getModifierGroupValidationMessage as getValidationMessage } from "@/features/product-configurator/utils/modifier-group-validation"
import { groupModifierOptionsByOptionGroup } from "@/features/product-configurator/utils/group-modifier-options-by-option-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ProductConfig } from "./PizzaBuilder"

type ModifierGroup =
  NonNullable<ProductConfig["product_modifier_groups"][number]["modifier_groups"]>

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

function PlacementIcon({
  placement,
}: {
  placement: SelectedModifier["placement"]
}) {
  if (placement === "whole") {
    return (
      <span className="block size-4 rounded-full border border-current bg-current" />
    )
  }

  return (
    <span className="relative block size-4 overflow-hidden rounded-full border border-current">
      <span
        className={`absolute inset-y-0 w-1/2 bg-current ${
          placement === "left" ? "left-0" : "right-0"
        }`}
      />
    </span>
  )
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

function hasEnabledModifierGroup(
  item: ProductConfig["product_modifier_groups"][number]
): item is ProductConfig["product_modifier_groups"][number] & {
  modifier_groups: ModifierGroup
} {
  return item.is_enabled && item.modifier_groups?.is_enabled === true
}

function getMultiplierOptions(group: ModifierGroup) {
  const min = Math.max(1, Number(group.min_multiplier) || 1)
  const max = Math.max(min, Number(group.max_multiplier) || min)
  const step = Math.max(1, Number(group.multiplier_step) || 1)
  const values: number[] = []

  for (let value = min; value <= max; value += step) {
    values.push(value)
  }

  return values
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
      filterEnabledProductVariants(product.variants),
    [product.variants]
  )

  const isVariantUnavailable = product.has_variants && sortedVariants.length === 0

  const [variantId, setVariantId] = useState(
    getSafeInitialVariantId(sortedVariants, cartItem?.variantId)
  )
  const [quantity, setQuantity] = useState(getInitialQuantity(cartItem))
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, SelectedModifier>
  >(() => getInitialSelectedModifiers(cartItem))
  const hasAppliedDefaultModifiersRef = useRef(false)

  const { addItem, updateItem } = useCart()

  const selectedVariant = sortedVariants.find(
    (variant) => variant.id === variantId
  )

  const baseModifierGroups = useMemo(
    () =>
      [...(product.product_modifier_groups ?? [])]
        .sort((first, second) => first.sort_order - second.sort_order)
        .filter(hasEnabledModifierGroup)
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
            modifier_options: filterEnabledModifierOptions(
              group.modifier_options ?? []
            ),
          }
        }),
    [product.product_modifier_groups, product.product_included_modifier_groups]
  )

  const modifierGroups = useMemo(
    () => {
      const availableModifierGroups = filterModifierOptionsByVariant({
        selectedVariantId: selectedVariant?.id,
        modifierGroups: baseModifierGroups,
        availabilityRules:
          product.product_variant_modifier_option_availability_rules ?? [],
      })

      return applyVariantModifierOptionPrices({
        selectedVariantId: selectedVariant?.id,
        modifierGroups: availableModifierGroups,
        priceOverrides:
          product.product_variant_modifier_option_price_overrides ?? [],
      })
    },
    [
      baseModifierGroups,
      selectedVariant?.id,
      product.product_variant_modifier_option_availability_rules,
      product.product_variant_modifier_option_price_overrides,
    ]
  )

  const pricing = useMemo(
    () =>
      priceConfiguredProduct({
        productBasePrice: product.base_price ?? 0,
        selectedVariant,
        modifierGroups,
        selectedModifiers,
        productDefaultModifierOptions: product.product_default_modifier_options,
        quantity,
      }),
    [
      modifierGroups,
      product.base_price,
      product.product_default_modifier_options,
      quantity,
      selectedModifiers,
      selectedVariant,
    ]
  )

  useEffect(() => {
    if (!open) {
      hasAppliedDefaultModifiersRef.current = false
      return
    }

    if (mode === "edit" || cartItem || hasAppliedDefaultModifiersRef.current) {
      return
    }

    hasAppliedDefaultModifiersRef.current = true
    setSelectedModifiers(
      getInitialSelectedModifiersFromDefaults({
        defaults: product.product_default_modifier_options,
        modifierGroups,
      })
    )
  }, [
    cartItem,
    mode,
    modifierGroups,
    open,
    product.product_default_modifier_options,
  ])

  function handleVariantChange(nextVariantId: string) {
    const nextVariant = sortedVariants.find(
      (variant) => variant.id === nextVariantId
    )
    const nextAvailableModifierGroups = filterModifierOptionsByVariant({
      selectedVariantId: nextVariant?.id,
      modifierGroups: baseModifierGroups,
      availabilityRules:
        product.product_variant_modifier_option_availability_rules ?? [],
    })
    const nextModifierGroups = applyVariantModifierOptionPrices({
      selectedVariantId: nextVariant?.id,
      modifierGroups: nextAvailableModifierGroups,
      priceOverrides: product.product_variant_modifier_option_price_overrides ?? [],
    })

    setVariantId(nextVariantId)
    setSelectedModifiers((current) =>
      removeUnavailableSelectedModifiers({
        selectedModifiers: current,
        modifierGroups: nextModifierGroups,
      })
    )
  }

  const unitTotal = pricing.unitPrice
  const total = pricing.lineTotal

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
    return getValidationMessage(
      group,
      Object.values(selectedModifiers).map((selected) => selected.optionId)
    )
  }

  const validationMessages = modifierGroups
    .map((group) => ({
      groupId: group.id,
      groupName: group.name,
      message: getGroupValidationMessage(group),
    }))
    .filter((item) => item.message)

  const canSubmit = validationMessages.length === 0 && !isVariantUnavailable

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
          priceDelta:
            pricing.pricedSelectedModifiers[option.id]?.priceDelta ??
            Number(option.price_delta),
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
      <DialogContent className="flex h-[92dvh] max-h-[92dvh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:h-[min(90dvh,48rem)] sm:max-h-[90dvh]">
        <DialogHeader className="shrink-0 border-b px-4 py-4">
          <DialogTitle>{product.name}</DialogTitle>
          {product.description ? (
            <p className="text-sm leading-5 text-muted-foreground">
              {product.description}
            </p>
          ) : null}
        </DialogHeader>

        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {sortedVariants.length > 0 ? (
            <ThemedCard className="p-4">
              <h3 className="mb-3 text-lg font-semibold">Choose an option</h3>
              <div className="grid gap-2">
                {sortedVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => handleVariantChange(variant.id)}
                    className={`flex min-h-12 items-center justify-between rounded-lg border p-3 text-left ${
                      variantId === variant.id
                        ? "border-accent bg-accent/20"
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
          ) : product.has_variants ? (
            <ThemedCard className="p-4">
              <h3 className="mb-2 text-lg font-semibold">Choose an option</h3>
              <p className="text-sm text-muted-foreground">
                This item is not currently available.
              </p>
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
                  {group.included_quantity && group.included_quantity > 0 ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Includes {group.included_quantity}{" "}
                      {group.included_quantity === 1
                        ? "selection"
                        : "selections"}
                      .
                    </p>
                  ) : null}
                  {group.max_allowed ? (
                    <p className="text-sm text-muted-foreground">
                      Choose up to {group.max_allowed}.
                    </p>
                  ) : null}
                </div>
                {group.is_required ? (
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    Required
                  </span>
                ) : null}
              </div>

              {getGroupValidationMessage(group) ? (
                <p className="mb-3 text-sm text-destructive">
                  {getGroupValidationMessage(group)}
                </p>
              ) : null}

              <div className="space-y-3">
                {groupModifierOptionsByOptionGroup<ModifierOption>(
                  group.modifier_options ?? []
                ).map((optionGroup) => (
                  <div
                    key={optionGroup.optionGroup?.id ?? "ungrouped"}
                    className={
                      optionGroup.optionGroup
                        ? "rounded-lg border bg-muted/20 p-2.5"
                        : undefined
                    }
                  >
                    {optionGroup.optionGroup ? (
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold">
                          {optionGroup.optionGroup.name}
                        </h4>
                        {optionGroup.optionGroup.description ? (
                          <p className="text-xs text-muted-foreground">
                            {optionGroup.optionGroup.description}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="space-y-1.5">
                      {optionGroup.options.map((option) => {
                        const selected = selectedModifiers[option.id]
                        const displayPriceDelta = selected
                          ? pricing.pricedSelectedModifiers[option.id]?.priceDelta ??
                            Number(option.price_delta)
                          : Number(option.price_delta)

                        return (
                          <div
                            key={option.id}
                            aria-selected={selected ? "true" : "false"}
                            className={`rounded-md border px-3 py-2 ${
                              selected ? "border-accent bg-accent/20" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <button
                                type="button"
                                aria-pressed={selected ? "true" : "false"}
                                onClick={() => toggleModifier(group, option)}
                                className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium"
                              >
                                <Check
                                  aria-hidden="true"
                                  className={`size-5 shrink-0 ${
                                    selected
                                      ? "text-accent-foreground"
                                      : "text-transparent"
                                  }`}
                                />
                                <span className="min-w-0 flex-1 truncate">
                                  {option.name}
                                </span>
                              </button>

                              {displayPriceDelta > 0 ? (
                                <span className="shrink-0 text-sm font-semibold">
                                  +${displayPriceDelta.toFixed(2)}
                                </span>
                              ) : null}
                            </div>

                            {selected &&
                            (group.supports_placement ||
                              group.supports_multiplier) ? (
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                {group.supports_placement ? (
                                  <div className="flex min-w-[7.5rem] flex-1 items-center gap-1.5">
                                    {(
                                      [
                                        ["left", "Left side"],
                                        ["whole", "Whole item"],
                                        ["right", "Right side"],
                                      ] as const
                                    ).map(([placement, label]) => (
                                      <button
                                        key={placement}
                                        type="button"
                                        aria-label={`Set ${option.name} placement to ${label}`}
                                        title={label}
                                        onClick={() =>
                                          updateModifier(option.id, {
                                            placement,
                                          })
                                        }
                                        className={`flex size-9 items-center justify-center rounded-md border ${
                                          selected.placement === placement
                                            ? "border-accent bg-accent text-accent-foreground"
                                            : "bg-card"
                                        }`}
                                      >
                                        <PlacementIcon placement={placement} />
                                        <span className="sr-only">
                                          {label}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : null}

                                {group.supports_multiplier ? (
                                  <select
                                    aria-label={`Amount for ${option.name}`}
                                    value={selected.multiplier}
                                    onChange={(event) =>
                                      updateModifier(option.id, {
                                        multiplier: Number(event.target.value),
                                      })
                                    }
                                    className="h-9 w-20 shrink-0 rounded-md border bg-background px-2 text-sm"
                                  >
                                    {getMultiplierOptions(group).map(
                                      (amount) => (
                                        <option key={amount} value={amount}>
                                          {amount}x
                                        </option>
                                      )
                                    )}
                                  </select>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ThemedCard>
          ))}
        </div>

        <div className="shrink-0 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
            <span>${total.toFixed(2)}</span>
          </ThemedButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
