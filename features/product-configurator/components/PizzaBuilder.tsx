"use client";

import { useMemo, useState } from "react";
import { ThemedButton } from "@/components/themed/ThemedButton";
import { ThemedCard } from "@/components/themed/ThemedCard";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { calculateProductTotal } from "@/lib/pricing/calculate-product-total";
import { useCart } from "@/features/cart/context/CartProvider";
import type { CartItem, CartModifier } from "@/features/cart/types/cart";
import { getSafeInitialVariantId } from "@/features/product-configurator/utils/cart-safety";
import { filterEnabledModifierOptions } from "@/features/product-configurator/utils/filter-enabled-modifier-options";
import { filterEnabledProductVariants } from "@/features/product-configurator/utils/filter-enabled-product-variants";
import { getModifierGroupValidationMessage as getValidationMessage } from "@/features/product-configurator/utils/modifier-group-validation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Variant = {
  id: string;
  name: string;
  base_price: number;
  is_default: boolean;
  is_enabled: boolean;
  sort_order: number;
};

type ModifierOption = {
  id: string;
  name: string;
  price_delta: number;
  is_enabled: boolean;
  sort_order: number;
  modifier_option_group_id: string | null;
  modifier_option_groups: ModifierOptionGroup | null;
};

type ModifierOptionGroup = {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  sort_order: number;
};

type ModifierGroup = {
  id: string;
  name: string;
  selection_type: string;
  is_required: boolean;
  is_enabled: boolean;
  min_required: number;
  max_allowed: number | null;
  supports_placement: boolean;
  supports_multiplier: boolean;
  min_multiplier: number;
  max_multiplier: number;
  multiplier_step: number;
  included_quantity?: number;
  is_swappable?: boolean;
  charge_for_extra?: boolean;
  modifier_options: ModifierOption[];
};

type ProductModifierGroup = {
  id: string;
  is_enabled: boolean;
  sort_order: number;
  modifier_groups: ModifierGroup | null;
};

export type ProductConfig = {
  id: string;
  name: string;
  description: string | null;
  builder_template: string | null;
  has_variants: boolean;
  is_enabled: boolean;
  base_price: number | null;
  product_variants: Variant[];
  product_modifier_groups: ProductModifierGroup[];
  product_included_modifier_groups?: IncludedModifierGroup[];
};

type SelectedModifier = {
  optionId: string;
  placement: "left" | "whole" | "right";
  multiplier: number;
};

type PizzaBuilderProps = {
  product: ProductConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCartItem?: CartItem | null;
};

type IncludedModifierGroup = {
  id: string;
  modifier_group_id: string;
  included_quantity: number;
  is_swappable: boolean;
  charge_for_extra: boolean;
};

function getInitialSelectedModifiers(editingCartItem?: CartItem | null) {
  if (!editingCartItem) return {};

  return editingCartItem.modifiers.reduce<Record<string, SelectedModifier>>(
    (selectedModifiers, modifier) => ({
      ...selectedModifiers,
      [modifier.optionId]: {
        optionId: modifier.optionId,
        placement: modifier.placement,
        multiplier: modifier.multiplier,
      },
    }),
    {},
  );
}

function hasEnabledModifierGroup(
  item: ProductModifierGroup,
): item is ProductModifierGroup & { modifier_groups: ModifierGroup } {
  return item.is_enabled && item.modifier_groups?.is_enabled === true;
}

export function PizzaBuilder({
  product,
  open,
  onOpenChange,
  editingCartItem = null,
}: PizzaBuilderProps) {
  const sortedVariants = useMemo(
    () =>
      filterEnabledProductVariants(product.product_variants),
    [product.product_variants],
  );

  const isVariantUnavailable = product.has_variants && sortedVariants.length === 0;
  const initialVariantId = getSafeInitialVariantId(
    sortedVariants,
    editingCartItem?.variantId,
  );

  const [variantId, setVariantId] = useState(initialVariantId);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, SelectedModifier>
  >(() => getInitialSelectedModifiers(editingCartItem));

  const { addItem, updateItem } = useCart();

  const selectedVariant = sortedVariants.find(
    (variant) => variant.id === variantId,
  );

  const modifierGroups = useMemo(
    () =>
      [...(product.product_modifier_groups ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .filter(hasEnabledModifierGroup)
        .map((item) => {
          const group = item.modifier_groups;

          const includedRule = product.product_included_modifier_groups?.find(
            (rule) => rule.modifier_group_id === group.id,
          );

          return {
            ...group,
            included_quantity: includedRule
              ? Number(includedRule.included_quantity)
              : 0,
            is_swappable: includedRule?.is_swappable ?? false,
            charge_for_extra: includedRule?.charge_for_extra ?? true,
            modifier_options: filterEnabledModifierOptions(
              group.modifier_options ?? [],
            ),
          };
        }),
    [product.product_modifier_groups, product.product_included_modifier_groups],
  );

  const total = useMemo(() => {
    const basePrice = selectedVariant?.base_price ?? product.base_price ?? 0;

    return calculateProductTotal({
      basePrice,
      modifierGroups,
      selectedModifiers,
    });
  }, [selectedVariant, product.base_price, selectedModifiers, modifierGroups]);

  function toggleModifier(group: ModifierGroup, option: ModifierOption) {
    setSelectedModifiers((current) => {
      if (current[option.id]) {
        const copy = { ...current };
        delete copy[option.id];
        return copy;
      }

      const selectedInGroup = Object.values(current).filter((selected) =>
        group.modifier_options.some(
          (groupOption) => groupOption.id === selected.optionId,
        ),
      );

      if (group.selection_type === "single" && selectedInGroup.length > 0) {
        const copy = { ...current };

        selectedInGroup.forEach((selected) => {
          delete copy[selected.optionId];
        });

        return {
          ...copy,
          [option.id]: {
            optionId: option.id,
            placement: "whole",
            multiplier: 1,
          },
        };
      }

      if (group.max_allowed && selectedInGroup.length >= group.max_allowed) {
        return current;
      }

      return {
        ...current,
        [option.id]: {
          optionId: option.id,
          placement: "whole",
          multiplier: 1,
        },
      };
    });
  }

  function updateModifier(
    optionId: string,
    updates: Partial<SelectedModifier>,
  ) {
    setSelectedModifiers((current) => ({
      ...current,
      [optionId]: {
        ...current[optionId],
        ...updates,
      },
    }));
  }

  function groupOptionsBySubgroup(options: ModifierOption[]) {
    const sortedOptions = [...options].sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    const grouped = sortedOptions.reduce<
      Record<
        string,
        {
          group: ModifierOptionGroup | null;
          options: ModifierOption[];
        }
      >
    >((acc, option) => {
      const key = option.modifier_option_group_id ?? "ungrouped";

      if (!acc[key]) {
        acc[key] = {
          group: option.modifier_option_groups ?? null,
          options: [],
        };
      }

      acc[key].options.push(option);

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => {
      const aOrder = a.group?.sort_order ?? 999;
      const bOrder = b.group?.sort_order ?? 999;

      return aOrder - bOrder;
    });
  }

  function getGroupValidationMessage(group: ModifierGroup) {
    return getValidationMessage(
      group,
      Object.values(selectedModifiers).map((selected) => selected.optionId),
    );
  }

  const validationMessages = modifierGroups
    .map((group) => ({
      groupId: group.id,
      groupName: group.name,
      message: getGroupValidationMessage(group),
    }))
    .filter((item) => item.message);

  const canAddToCart = validationMessages.length === 0 && !isVariantUnavailable;

  function handleCartSubmit() {
    if (!canAddToCart) return;

    const modifiers: CartModifier[] = Object.values(selectedModifiers)
      .map((selected) => {
        const group = modifierGroups.find((modifierGroup) =>
          modifierGroup.modifier_options.some(
            (option) => option.id === selected.optionId,
          ),
        );

        const option = group?.modifier_options.find(
          (modifierOption) => modifierOption.id === selected.optionId,
        );

        if (!group || !option) return null;

        return {
          optionId: option.id,
          optionName: option.name,
          groupId: group.id,
          groupName: group.name,
          placement: selected.placement,
          multiplier: selected.multiplier,
          priceDelta: Number(option.price_delta),
        };
      })
      .filter(Boolean) as CartModifier[];

    const quantity = editingCartItem?.quantity ?? 1;
    const cartItem: CartItem = {
      cartItemId: editingCartItem?.cartItemId ?? crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      quantity,
      unitPrice: total,
      totalPrice: total * quantity,
      modifiers,
    };

    if (editingCartItem) {
      updateItem(editingCartItem.cartItemId, cartItem);
    } else {
      addItem(cartItem);
    }

    onOpenChange(false);
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

            {isVariantUnavailable ? (
              <p className="text-sm text-muted-foreground">
                This item is not currently available.
              </p>
            ) : (
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
            )}
          </ThemedCard>

          {modifierGroups.map((group) => (
            <ThemedCard key={group.id} className="p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  {group.included_quantity && group.included_quantity > 0 ? (
                    <p className="mb-3 text-sm text-muted-foreground">
                      Includes {group.included_quantity}{" "}
                      {group.included_quantity === 1
                        ? "selection"
                        : "selections"}
                      {group.is_swappable ? " — swappable" : ""}.
                    </p>
                  ) : null}

                  {getGroupValidationMessage(group) ? (
                    <p className="mb-3 text-sm text-destructive">
                      {getGroupValidationMessage(group)}
                    </p>
                  ) : null}
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

              <div className="space-y-6">
                {groupOptionsBySubgroup(group.modifier_options ?? []).map(
                  (optionGroup) => (
                    <div key={optionGroup.group?.id ?? "ungrouped"}>
                      {optionGroup.group ? (
                        <div className="mb-3">
                          <h4 className="font-semibold">
                            Choose Your {optionGroup.group.name}
                          </h4>

                          {optionGroup.group.description ? (
                            <p className="text-sm text-muted-foreground">
                              {optionGroup.group.description}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="space-y-3">
                        {optionGroup.options.map((option) => {
                          const selected = selectedModifiers[option.id];

                          return (
                            <div
                              key={option.id}
                              className="rounded-lg border p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleModifier(group, option)}
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
                                          updateModifier(option.id, {
                                            placement,
                                          })
                                        }
                                        className={`rounded-md border px-3 py-2 text-sm capitalize ${
                                          selected.placement === placement
                                            ? "bg-primary text-primary-foreground"
                                            : ""
                                        }`}
                                      >
                                        {placement}
                                      </button>
                                    ),
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
                                      (_, index) => index + 1,
                                    ).map((amount) => (
                                      <option key={amount} value={amount}>
                                        {amount}x
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ),
                )}
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

          {isVariantUnavailable ? (
            <div className="mb-3 rounded-lg border p-3 text-sm text-muted-foreground">
              This item has no available variants right now.
            </div>
          ) : null}

          <ThemedButton
            disabled={!canAddToCart}
            onClick={handleCartSubmit}
            className="h-12 w-full justify-between text-base"
          >
            <span>{editingCartItem ? "Save changes" : "Add to cart"}</span>
            <span>${total.toFixed(2)}</span>
          </ThemedButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
