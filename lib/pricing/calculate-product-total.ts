import {
  priceConfiguredProduct,
  type ConfiguredProductDefaultModifierOption,
  type ConfiguredProductModifierGroup,
  type ConfiguredProductSelectedModifier,
} from "@/lib/pricing/price-configured-product"

export type PricingModifierOption = {
  id: string
  price_delta: number
}

export type PricingModifierGroup = {
  id: string
  modifier_options: PricingModifierOption[]
  included_quantity?: number
  is_swappable?: boolean
  charge_for_extra?: boolean
}

export type PricingSelectedModifier = {
  optionId: string
  multiplier: number
  placement?: "left" | "whole" | "right"
}

export type PricingIncludedModifierOption = {
  modifier_option_id: string
  multiplier?: number | null
  quantity?: number | null
  is_enabled?: boolean | null
}

type CalculateProductTotalInput = {
  basePrice: number
  modifierGroups: PricingModifierGroup[]
  selectedModifiers: Record<string, PricingSelectedModifier>
  includedModifierOptionUnits?: Record<string, number>
}

export type PricedSelectedModifier = PricingSelectedModifier & {
  priceDelta: number
}

export function getIncludedModifierOptionUnits(
  includedOptions: PricingIncludedModifierOption[] | null | undefined
) {
  return (includedOptions ?? []).reduce<Record<string, number>>(
    (unitsByOptionId, option) => {
      if (option.is_enabled === false) return unitsByOptionId

      const quantity = Math.max(1, Number(option.quantity) || 1)
      const multiplier = Math.max(1, Number(option.multiplier) || 1)

      return {
        ...unitsByOptionId,
        [option.modifier_option_id]:
          (unitsByOptionId[option.modifier_option_id] ?? 0) +
          quantity * multiplier,
      }
    },
    {}
  )
}

function mapIncludedUnitsToDefaultOptions(
  includedModifierOptionUnits: Record<string, number> | undefined
): ConfiguredProductDefaultModifierOption[] {
  return Object.entries(includedModifierOptionUnits ?? {}).map(
    ([modifierOptionId, quantity]) => ({
      modifierOptionId,
      quantity,
      multiplier: 1,
      isEnabled: true,
    })
  )
}

function getPricingResult({
  basePrice,
  modifierGroups,
  selectedModifiers,
  includedModifierOptionUnits,
}: CalculateProductTotalInput) {
  return priceConfiguredProduct({
    productBasePrice: basePrice,
    selectedModifiers:
      selectedModifiers as Record<string, ConfiguredProductSelectedModifier>,
    modifierGroups: modifierGroups as ConfiguredProductModifierGroup[],
    productDefaultModifierOptions: mapIncludedUnitsToDefaultOptions(
      includedModifierOptionUnits
    ),
  })
}

export function getPricedSelectedModifiers({
  modifierGroups,
  selectedModifiers,
  includedModifierOptionUnits = {},
}: Omit<CalculateProductTotalInput, "basePrice">) {
  const result = getPricingResult({
    basePrice: 0,
    modifierGroups,
    selectedModifiers,
    includedModifierOptionUnits,
  })

  return Object.fromEntries(
    Object.entries(result.pricedSelectedModifiers).map(
      ([optionId, modifier]) => [
        optionId,
        {
          optionId: modifier.optionId,
          placement: modifier.placement,
          multiplier: modifier.multiplier,
          priceDelta: modifier.priceDelta,
        },
      ]
    )
  ) as Record<string, PricedSelectedModifier>
}

export function calculateProductTotal(input: CalculateProductTotalInput) {
  return getPricingResult(input).unitPrice
}

