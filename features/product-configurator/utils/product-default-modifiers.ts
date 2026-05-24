export type ProductDefaultModifierOptionSelection = {
  modifier_option_id: string
  placement: "left" | "whole" | "right"
  multiplier: number
  is_enabled: boolean
  sort_order: number
}

export type ProductDefaultModifierGroup = {
  modifier_options: {
    id: string
  }[]
}

export type SelectedProductDefaultModifier = {
  optionId: string
  placement: "left" | "whole" | "right"
  multiplier: number
}

export function getInitialSelectedModifiersFromDefaults({
  defaults,
  modifierGroups,
}: {
  defaults: ProductDefaultModifierOptionSelection[] | null | undefined
  modifierGroups: ProductDefaultModifierGroup[]
}) {
  const availableOptionIds = new Set(
    modifierGroups.flatMap((group) =>
      group.modifier_options.map((option) => option.id)
    )
  )

  return [...(defaults ?? [])]
    .filter((defaultSelection) => defaultSelection.is_enabled)
    .sort((first, second) => first.sort_order - second.sort_order)
    .reduce<Record<string, SelectedProductDefaultModifier>>(
      (selectedModifiers, defaultSelection) => {
        if (!availableOptionIds.has(defaultSelection.modifier_option_id)) {
          return selectedModifiers
        }

        return {
          ...selectedModifiers,
          [defaultSelection.modifier_option_id]: {
            optionId: defaultSelection.modifier_option_id,
            placement: defaultSelection.placement,
            multiplier: defaultSelection.multiplier,
          },
        }
      },
      {}
    )
}
