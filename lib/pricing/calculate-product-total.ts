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

type CalculateProductTotalInput = {
  basePrice: number
  modifierGroups: PricingModifierGroup[]
  selectedModifiers: Record<string, PricingSelectedModifier>
}

export function calculateProductTotal({
  basePrice,
  modifierGroups,
  selectedModifiers,
}: CalculateProductTotalInput) {
  const modifierTotal = modifierGroups.reduce((groupSum, group) => {
    const selectedForGroup = Object.values(selectedModifiers).filter(
      (selected) =>
        group.modifier_options.some((option) => option.id === selected.optionId)
    )

    const selectedWithPrices = selectedForGroup
      .map((selected) => {
        const option = group.modifier_options.find(
          (modifierOption) => modifierOption.id === selected.optionId
        )

        if (!option) return null

        return {
          selected,
          option,
          totalPrice: Number(option.price_delta) * selected.multiplier,
        }
      })
      .filter(Boolean) as {
      selected: PricingSelectedModifier
      option: PricingModifierOption
      totalPrice: number
    }[]

    const includedQuantity = group.included_quantity ?? 0
    const chargeForExtra = group.charge_for_extra ?? true

    if (!chargeForExtra || includedQuantity <= 0) {
      return (
        groupSum +
        selectedWithPrices.reduce((sum, item) => sum + item.totalPrice, 0)
      )
    }

    const sortedByPrice = [...selectedWithPrices].sort(
      (a, b) => b.totalPrice - a.totalPrice
    )

    const freeItems = sortedByPrice.slice(0, includedQuantity)
    const paidItems = sortedByPrice.slice(includedQuantity)

    return groupSum + paidItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }, 0)

  return basePrice + modifierTotal
}