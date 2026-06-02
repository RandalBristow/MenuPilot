"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ThemedButton } from "@/components/themed/ThemedButton";
import { ThemedCard } from "@/components/themed/ThemedCard";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { priceConfiguredProduct } from "@/lib/pricing/price-configured-product";
import { useCart } from "@/features/cart/context/CartProvider";
import type { CartItem, CartModifier } from "@/features/cart/types/cart";
import { getSafeInitialVariantId } from "@/features/product-configurator/utils/cart-safety";
import { filterEnabledModifierOptions } from "@/features/product-configurator/utils/filter-enabled-modifier-options";
import { filterEnabledProductVariants } from "@/features/product-configurator/utils/filter-enabled-product-variants";
import {
  filterModifierOptionsByVariant,
  removeUnavailableSelectedModifiers,
  type VariantModifierOptionAvailabilityRule,
} from "@/features/product-configurator/utils/filter-modifier-options-by-variant";
import {
  applyVariantModifierOptionPrices,
  type VariantModifierOptionPriceOverride,
} from "@/features/product-configurator/utils/variant-modifier-pricing";
import { getInitialSelectedModifiersFromDefaults } from "@/features/product-configurator/utils/product-default-modifiers";
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

type ProductDefaultModifierOption = {
  id: string;
  modifier_group_id: string;
  modifier_option_id: string;
  placement: "left" | "whole" | "right";
  multiplier: number;
  quantity: number;
  is_enabled: boolean;
  sort_order: number;
};

export type ProductConfig = {
  id: string;
  name: string;
  description: string | null;
  builder_template: string | null;
  has_variants: boolean;
  is_enabled: boolean;
  base_price: number | null;
  variants: Variant[];
  product_modifier_groups: ProductModifierGroup[];
  product_included_modifier_groups?: IncludedModifierGroup[];
  product_default_modifier_options?: ProductDefaultModifierOption[];
  product_variant_modifier_option_availability_rules?: VariantModifierOptionAvailabilityRule[];
  product_variant_modifier_option_price_overrides?: VariantModifierOptionPriceOverride[];
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

function PlacementIcon({
  placement,
}: {
  placement: SelectedModifier["placement"];
}) {
  if (placement === "whole") {
    return (
      <span className="block size-4 rounded-full border border-current bg-current" />
    );
  }

  return (
    <span className="relative block size-4 overflow-hidden rounded-full border border-current">
      <span
        className={`absolute inset-y-0 w-1/2 bg-current ${
          placement === "left" ? "left-0" : "right-0"
        }`}
      />
    </span>
  );
}

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
      filterEnabledProductVariants(product.variants),
    [product.variants],
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
  const hasAppliedDefaultModifiersRef = useRef(false);

  const { addItem, updateItem } = useCart();

  const selectedVariant = sortedVariants.find(
    (variant) => variant.id === variantId,
  );

  const baseModifierGroups = useMemo(
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

  const modifierGroups = useMemo(
    () => {
      const availableModifierGroups = filterModifierOptionsByVariant({
        selectedVariantId: selectedVariant?.id,
        modifierGroups: baseModifierGroups,
        availabilityRules:
          product.product_variant_modifier_option_availability_rules ?? [],
      });

      return applyVariantModifierOptionPrices({
        selectedVariantId: selectedVariant?.id,
        modifierGroups: availableModifierGroups,
        priceOverrides:
          product.product_variant_modifier_option_price_overrides ?? [],
      });
    },
    [
      baseModifierGroups,
      selectedVariant?.id,
      product.product_variant_modifier_option_availability_rules,
      product.product_variant_modifier_option_price_overrides,
    ],
  );

  const pricing = useMemo(
    () =>
      priceConfiguredProduct({
        productBasePrice: product.base_price ?? 0,
        selectedVariant,
        modifierGroups,
        selectedModifiers,
        productDefaultModifierOptions: product.product_default_modifier_options,
      }),
    [
      modifierGroups,
      product.base_price,
      product.product_default_modifier_options,
      selectedModifiers,
      selectedVariant,
    ],
  );

  useEffect(() => {
    if (!open) {
      hasAppliedDefaultModifiersRef.current = false;
      return;
    }

    if (editingCartItem || hasAppliedDefaultModifiersRef.current) return;

    hasAppliedDefaultModifiersRef.current = true;
    setSelectedModifiers(
      getInitialSelectedModifiersFromDefaults({
        defaults: product.product_default_modifier_options,
        modifierGroups,
      }),
    );
  }, [editingCartItem, modifierGroups, open, product.product_default_modifier_options]);

  function handleVariantChange(nextVariantId: string) {
    const nextVariant = sortedVariants.find(
      (variant) => variant.id === nextVariantId,
    );
    const nextAvailableModifierGroups = filterModifierOptionsByVariant({
      selectedVariantId: nextVariant?.id,
      modifierGroups: baseModifierGroups,
      availabilityRules:
        product.product_variant_modifier_option_availability_rules ?? [],
    });
    const nextModifierGroups = applyVariantModifierOptionPrices({
      selectedVariantId: nextVariant?.id,
      modifierGroups: nextAvailableModifierGroups,
      priceOverrides: product.product_variant_modifier_option_price_overrides ?? [],
    });

    setVariantId(nextVariantId);
    setSelectedModifiers((current) =>
      removeUnavailableSelectedModifiers({
        selectedModifiers: current,
        modifierGroups: nextModifierGroups,
      }),
    );
  }

  const total = pricing.unitPrice;

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
          priceDelta:
            pricing.pricedSelectedModifiers[option.id]?.priceDelta ??
            Number(option.price_delta),
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
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <ThemedCard className="p-3">
            <h3 className="mb-2 text-base font-semibold">Choose Your Size</h3>

            {isVariantUnavailable ? (
              <p className="text-sm text-muted-foreground">
                This item is not currently available.
              </p>
            ) : (
              <RadioGroup value={variantId} onValueChange={handleVariantChange}>
                <div className="space-y-1.5">
                  {sortedVariants.map((variant) => (
                    <Label
                      key={variant.id}
                      className="flex min-h-10 cursor-pointer items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5">
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
            <ThemedCard key={group.id} className="p-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">{group.name}</h3>
                  {group.included_quantity && group.included_quantity > 0 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Includes {group.included_quantity}{" "}
                      {group.included_quantity === 1
                        ? "selection"
                        : "selections"}
                      {group.is_swappable ? " - swappable" : ""}.
                    </p>
                  ) : null}

                  {getGroupValidationMessage(group) ? (
                    <p className="mt-1 text-xs text-destructive">
                      {getGroupValidationMessage(group)}
                    </p>
                  ) : null}
                  {group.max_allowed ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
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

              <div className="space-y-3">
                {groupOptionsBySubgroup(group.modifier_options ?? []).map(
                  (optionGroup) => (
                    <div
                      key={optionGroup.group?.id ?? "ungrouped"}
                      className={
                        optionGroup.group
                          ? "rounded-lg border bg-muted/20 p-2.5"
                          : undefined
                      }
                    >
                      {optionGroup.group ? (
                        <div className="mb-2">
                          <h4 className="text-sm font-semibold">
                            {optionGroup.group.name}
                          </h4>

                          {optionGroup.group.description ? (
                            <p className="text-xs text-muted-foreground">
                              {optionGroup.group.description}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="space-y-1.5">
                        {optionGroup.options.map((option) => {
                          const selected = selectedModifiers[option.id];
                          const displayPriceDelta = selected
                            ? pricing.pricedSelectedModifiers[option.id]?.priceDelta ??
                              Number(option.price_delta)
                            : Number(option.price_delta);

                          return (
                            <div
                              key={option.id}
                              className={`rounded-md border px-3 py-2 ${
                                selected ? "border-accent bg-accent/20" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleModifier(group, option)}
                                  className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                                >
                                  {selected ? "Selected: " : ""}
                                  {option.name}
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
                                          ["whole", "Whole pizza"],
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
                                          <PlacementIcon
                                            placement={placement}
                                          />
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
                                          multiplier: Number(
                                            event.target.value,
                                          ),
                                        })
                                      }
                                      className="h-9 w-20 shrink-0 rounded-md border bg-background px-2 text-sm"
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
                                  ) : null}
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
