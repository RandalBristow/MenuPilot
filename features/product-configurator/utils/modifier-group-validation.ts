export type ConfiguratorValidationModifierGroup = {
  is_required: boolean
  min_required: number
  max_allowed: number | null
  modifier_options: {
    id: string
  }[]
}

export function getModifierGroupValidationMessage(
  group: ConfiguratorValidationModifierGroup,
  selectedOptionIds: string[]
) {
  const selectedCount = selectedOptionIds.filter((optionId) =>
    group.modifier_options.some((option) => option.id === optionId)
  ).length

  if (
    group.is_required &&
    group.modifier_options.length > 0 &&
    selectedCount < group.min_required
  ) {
    return `Please choose at least ${group.min_required}.`
  }

  if (group.max_allowed && selectedCount > group.max_allowed) {
    return `Please choose no more than ${group.max_allowed}.`
  }

  return null
}
