export type ModifierOptionGroupMetadata = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  sort_order: number
}

export type ModifierOptionWithOptionGroup = {
  id: string
  sort_order: number
  name?: string
  modifier_option_group_id: string | null
  modifier_option_groups: ModifierOptionGroupMetadata | null
}

export type GroupedModifierOptions<TOption> = {
  optionGroup: ModifierOptionGroupMetadata | null
  options: TOption[]
}

export function groupModifierOptionsByOptionGroup<
  TOption extends ModifierOptionWithOptionGroup,
>(options: TOption[]): GroupedModifierOptions<TOption>[] {
  const groupsById = new Map<string, GroupedModifierOptions<TOption>>()
  const sortedOptions = [...options].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return (first.name ?? "").localeCompare(second.name ?? "")
  })

  sortedOptions.forEach((option) => {
    const optionGroup = option.modifier_option_groups
    const key =
      option.modifier_option_group_id &&
      optionGroup &&
      optionGroup.is_enabled !== false
        ? option.modifier_option_group_id
        : "ungrouped"

    if (!groupsById.has(key)) {
      groupsById.set(key, {
        optionGroup: key === "ungrouped" ? null : optionGroup,
        options: [],
      })
    }

    groupsById.get(key)?.options.push(option)
  })

  return [...groupsById.values()].sort((first, second) => {
    const firstOrder = first.optionGroup?.sort_order ?? Number.MAX_SAFE_INTEGER
    const secondOrder = second.optionGroup?.sort_order ?? Number.MAX_SAFE_INTEGER

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder
    }

    return (first.optionGroup?.name ?? "").localeCompare(
      second.optionGroup?.name ?? ""
    )
  })
}
