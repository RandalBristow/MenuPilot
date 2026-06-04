export type ModifierOptionGroupSortOrderItem = {
  name: string
  sort_order: number
}

export function getNextModifierOptionGroupSortOrder({
  optionGroups,
}: {
  optionGroups: ModifierOptionGroupSortOrderItem[]
}) {
  if (optionGroups.length === 0) return 1

  return (
    optionGroups.reduce(
      (maxSortOrder, optionGroup) =>
        Math.max(maxSortOrder, optionGroup.sort_order),
      0
    ) + 1
  )
}

export function sortModifierOptionGroups<
  TOptionGroup extends ModifierOptionGroupSortOrderItem,
>(optionGroups: TOptionGroup[]) {
  return [...optionGroups].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}
