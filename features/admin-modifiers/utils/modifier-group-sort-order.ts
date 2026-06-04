export type ModifierGroupSortOrderItem = {
  name: string
  sort_order: number
}

export function getNextModifierGroupSortOrder({
  modifierGroups,
}: {
  modifierGroups: ModifierGroupSortOrderItem[]
}) {
  if (modifierGroups.length === 0) return 1

  return (
    modifierGroups.reduce(
      (maxSortOrder, modifierGroup) =>
        Math.max(maxSortOrder, modifierGroup.sort_order),
      0
    ) + 1
  )
}

export function sortModifierGroups<TModifierGroup extends ModifierGroupSortOrderItem>(
  modifierGroups: TModifierGroup[]
) {
  return [...modifierGroups].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}
