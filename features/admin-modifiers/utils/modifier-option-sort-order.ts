export type ModifierOptionSortOrderItem = {
  id: string
  name: string
  sort_order: number
  modifier_option_group_id: string | null
}

export function getNextModifierOptionSortOrder({
  options,
  modifierOptionGroupId,
}: {
  options: ModifierOptionSortOrderItem[]
  modifierOptionGroupId: string | null
}) {
  const scopedOptions = options.filter(
    (option) => option.modifier_option_group_id === modifierOptionGroupId
  )
  const maxSortOrder = scopedOptions.reduce(
    (max, option) => Math.max(max, option.sort_order),
    0
  )

  return maxSortOrder + 1
}

export function sortModifierOptionsWithinList<
  TOption extends ModifierOptionSortOrderItem,
>(options: TOption[]) {
  return [...options].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}

