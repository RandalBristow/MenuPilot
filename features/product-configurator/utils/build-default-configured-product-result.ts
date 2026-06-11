import { priceConfiguredProduct } from "@/lib/pricing/price-configured-product"
import type { CartModifier, ConfiguredProductResult } from "@/features/cart/types/cart"
import type { ProductConfig } from "@/features/product-configurator/components/ProductConfigurator"
import { buildConfiguredProductResult } from "@/features/product-configurator/utils/build-cart-item"
import { getSafeInitialVariantId } from "@/features/product-configurator/utils/cart-safety"
import { filterEnabledModifierOptions } from "@/features/product-configurator/utils/filter-enabled-modifier-options"
import { filterEnabledProductVariants } from "@/features/product-configurator/utils/filter-enabled-product-variants"
import {
  resolveIncludedQuantity,
  type ModifierIncludedRuleOverride,
} from "@/features/product-configurator/utils/modifier-included-rule-overrides"
import {
  filterModifierOptionsByVariant,
  removeUnavailableSelectedModifiers,
} from "@/features/product-configurator/utils/filter-modifier-options-by-variant"
import { getModifierGroupValidationMessage } from "@/features/product-configurator/utils/modifier-group-validation"
import { getInitialSelectedModifiersFromDefaults } from "@/features/product-configurator/utils/product-default-modifiers"
import type { SelectedProductDefaultModifier } from "@/features/product-configurator/utils/product-default-modifiers"
import { applyVariantModifierOptionPrices } from "@/features/product-configurator/utils/variant-modifier-pricing"

type ModifierGroup =
  NonNullable<ProductConfig["product_modifier_groups"][number]["modifier_groups"]>

function hasEnabledModifierGroup(
  item: ProductConfig["product_modifier_groups"][number]
): item is ProductConfig["product_modifier_groups"][number] & {
  modifier_groups: ModifierGroup
} {
  return item.is_enabled && item.modifier_groups?.is_enabled === true
}

function getEffectiveModifierGroups({
  product,
  selectedVariantId,
  modifierIncludedRuleOverrides = null,
}: {
  product: ProductConfig
  selectedVariantId: string | null | undefined
  modifierIncludedRuleOverrides?: ModifierIncludedRuleOverride[] | null
}) {
  const baseModifierGroups = [...(product.product_modifier_groups ?? [])]
    .sort((first, second) => first.sort_order - second.sort_order)
    .filter(hasEnabledModifierGroup)
    .map((item) => {
      const group = item.modifier_groups
      const includedRule = product.product_included_modifier_groups?.find(
        (rule) => rule.modifier_group_id === group.id
      )

      return {
        ...group,
        included_quantity: resolveIncludedQuantity({
          modifierGroupId: group.id,
          productIncludedQuantity: includedRule
            ? Number(includedRule.included_quantity)
            : 0,
          overrides: modifierIncludedRuleOverrides,
        }),
        is_swappable: includedRule?.is_swappable ?? false,
        charge_for_extra: includedRule?.charge_for_extra ?? true,
        modifier_options: filterEnabledModifierOptions(group.modifier_options ?? []),
      }
    })

  const availableModifierGroups = filterModifierOptionsByVariant({
    selectedVariantId,
    modifierGroups: baseModifierGroups,
    availabilityRules:
      product.product_variant_modifier_option_availability_rules ?? [],
  })

  return applyVariantModifierOptionPrices({
    selectedVariantId,
    modifierGroups: availableModifierGroups,
    priceOverrides:
      product.product_variant_modifier_option_price_overrides ?? [],
  })
}

function fillRequiredModifierDefaults({
  modifierGroups,
  selectedModifiers,
}: {
  modifierGroups: ReturnType<typeof getEffectiveModifierGroups>
  selectedModifiers: Record<string, SelectedProductDefaultModifier>
}) {
  return modifierGroups.reduce<Record<string, SelectedProductDefaultModifier>>(
    (current, group) => {
      if (!group.is_required || group.min_required <= 0) return current

      const selectedCount = group.modifier_options.filter(
        (option) => current[option.id]
      ).length
      const neededCount = group.min_required - selectedCount

      if (neededCount <= 0) return current

      return group.modifier_options
        .filter((option) => !current[option.id])
        .sort((first, second) => first.sort_order - second.sort_order)
        .slice(0, neededCount)
        .reduce<Record<string, SelectedProductDefaultModifier>>(
          (nextSelected, option) => ({
            ...nextSelected,
            [option.id]: {
              optionId: option.id,
              placement: "whole",
              multiplier: 1,
            },
          }),
          current
        )
    },
    selectedModifiers
  )
}

export function buildDefaultConfiguredProductResult({
  product,
  businessSlug,
  allowedVariantOptionIds = null,
  modifierIncludedRuleOverrides = null,
  requireExplicitRequiredModifierDefaults = false,
  requireSatisfiedIncludedModifierGroups = false,
}: {
  product: ProductConfig
  businessSlug?: string | null
  allowedVariantOptionIds?: string[] | null
  modifierIncludedRuleOverrides?: ModifierIncludedRuleOverride[] | null
  requireExplicitRequiredModifierDefaults?: boolean
  requireSatisfiedIncludedModifierGroups?: boolean
}): ConfiguredProductResult | null {
  const enabledVariants = filterEnabledProductVariants(product.variants).filter(
    (variant) =>
      allowedVariantOptionIds?.length
        ? allowedVariantOptionIds.includes(variant.id)
        : true
  )
  const selectedVariantId = getSafeInitialVariantId(enabledVariants)
  const selectedVariant =
    enabledVariants.find((variant) => variant.id === selectedVariantId) ?? null

  if (product.has_variants && !selectedVariant) return null

  const modifierGroups = getEffectiveModifierGroups({
    product,
    selectedVariantId: selectedVariant?.id,
    modifierIncludedRuleOverrides,
  })
  const defaultSelectedModifiers = getInitialSelectedModifiersFromDefaults({
    defaults: product.product_default_modifier_options,
    modifierGroups,
  })
  const selectedModifiers = removeUnavailableSelectedModifiers({
    selectedModifiers: requireExplicitRequiredModifierDefaults
      ? defaultSelectedModifiers
      : fillRequiredModifierDefaults({
          modifierGroups,
          selectedModifiers: defaultSelectedModifiers,
        }),
    modifierGroups,
  })
  const hasMissingRequiredModifiers = modifierGroups.some((group) =>
    getModifierGroupValidationMessage(
      group,
      Object.values(selectedModifiers).map((selected) => selected.optionId)
    )
  )

  if (hasMissingRequiredModifiers) return null

  const pricing = priceConfiguredProduct({
    productBasePrice: product.base_price ?? 0,
    builderTemplate: product.builder_template,
    pricingSettings: product.pricing_settings,
    selectedVariant,
    modifierGroups,
    selectedModifiers,
    productDefaultModifierOptions: product.product_default_modifier_options,
    quantity: 1,
  })

  const hasUnsatisfiedIncludedAllowance =
    requireSatisfiedIncludedModifierGroups &&
    Object.values(pricing.modifierGroups).some(
      (group) =>
        group.includedQuantity > 0 &&
        group.selectedUnits < group.includedQuantity
    )

  if (hasUnsatisfiedIncludedAllowance) return null

  const modifierExtraTotal = Object.values(pricing.pricedSelectedModifiers).reduce(
    (sum, modifier) => sum + modifier.priceDelta,
    0
  )
  const modifiers = Object.values(selectedModifiers)
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
    .filter((modifier): modifier is CartModifier => modifier !== null)

  return buildConfiguredProductResult({
    businessId: product.business_id,
    businessSlug,
    productId: product.id,
    productName: product.name,
    selectedVariant: selectedVariant
      ? {
          id: selectedVariant.id,
          name: selectedVariant.name,
          base_price: Number(selectedVariant.base_price),
        }
      : null,
    quantity: 1,
    unitPrice: pricing.unitPrice,
    configuredLineTotal: pricing.lineTotal,
    chargedModifierTotal: modifierExtraTotal,
    modifierExtraTotal,
    childExtraTotal: modifierExtraTotal,
    modifiers,
  })
}
