export type ConfiguratorModifierOption = {
  is_enabled: boolean
  modifier_option_groups: {
    is_enabled: boolean
  } | null
}

export function filterEnabledModifierOptions<T extends ConfiguratorModifierOption>(
  options: T[]
) {
  return options.filter((option) => {
    if (!option.is_enabled) return false
    if (
      option.modifier_option_groups &&
      !option.modifier_option_groups.is_enabled
    ) {
      return false
    }

    return true
  })
}
