export type PricingModifierOption = {
  id: string
  price_delta: number
}

export type PricingModifierGroup = {
  id: string
  modifier_options: PricingModifierOption[]
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
  const modifierOptions = modifierGroups.flatMap(
    (group) => group.modifier_options
  )

  const modifierTotal = Object.values(selectedModifiers).reduce(
    (sum, selected) => {
      const option = modifierOptions.find(
        (modifierOption) => modifierOption.id === selected.optionId
      )

      if (!option) return sum

      return sum + Number(option.price_delta) * selected.multiplier
    },
    0
  )

  return basePrice + modifierTotal
}