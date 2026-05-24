export type VariantModifierOptionAvailabilityRule = {
  variant_group_option_id: string
  modifier_group_id: string
  modifier_option_id: string
  is_available: boolean
  is_enabled: boolean
}

export type ModifierOptionAvailabilityGroup = {
  id: string
  modifier_options: {
    id: string
  }[]
}

type ModifierGroupWithOptions<TOption> = {
  id: string
  modifier_options: TOption[]
}

type ModifierOptionWithId = {
  id: string
}

function getRuleKey({
  variantId,
  modifierGroupId,
  modifierOptionId,
}: {
  variantId: string
  modifierGroupId: string
  modifierOptionId: string
}) {
  return `${variantId}:${modifierGroupId}:${modifierOptionId}`
}

function getEnabledRulesByVariantOption(
  rules: VariantModifierOptionAvailabilityRule[]
) {
  return new Map(
    rules
      .filter((rule) => rule.is_enabled)
      .map((rule) => [
        getRuleKey({
          variantId: rule.variant_group_option_id,
          modifierGroupId: rule.modifier_group_id,
          modifierOptionId: rule.modifier_option_id,
        }),
        rule,
      ])
  )
}

export function isModifierOptionAvailableForVariant({
  selectedVariantId,
  modifierGroupId,
  modifierOptionId,
  availabilityRules,
}: {
  selectedVariantId: string | null | undefined
  modifierGroupId: string
  modifierOptionId: string
  availabilityRules: VariantModifierOptionAvailabilityRule[]
}) {
  if (!selectedVariantId) return true

  const rule = getEnabledRulesByVariantOption(availabilityRules).get(
    getRuleKey({
      variantId: selectedVariantId,
      modifierGroupId,
      modifierOptionId,
    })
  )

  return rule?.is_available ?? true
}

export function filterModifierOptionsByVariant<
  TGroup extends ModifierGroupWithOptions<TOption>,
  TOption extends ModifierOptionWithId,
>({
  selectedVariantId,
  modifierGroups,
  availabilityRules,
}: {
  selectedVariantId: string | null | undefined
  modifierGroups: TGroup[]
  availabilityRules: VariantModifierOptionAvailabilityRule[]
}) {
  if (!selectedVariantId) return modifierGroups

  const rulesByVariantOption = getEnabledRulesByVariantOption(availabilityRules)

  return modifierGroups.map((group) => ({
    ...group,
    modifier_options: group.modifier_options.filter((option) => {
      const rule = rulesByVariantOption.get(
        getRuleKey({
          variantId: selectedVariantId,
          modifierGroupId: group.id,
          modifierOptionId: option.id,
        })
      )

      return rule?.is_available ?? true
    }),
  }))
}

export function removeUnavailableSelectedModifiers<TSelected>({
  selectedModifiers,
  modifierGroups,
}: {
  selectedModifiers: Record<string, TSelected>
  modifierGroups: ModifierOptionAvailabilityGroup[]
}) {
  const availableOptionIds = new Set(
    modifierGroups.flatMap((group) =>
      group.modifier_options.map((option) => option.id)
    )
  )

  return Object.fromEntries(
    Object.entries(selectedModifiers).filter(([optionId]) =>
      availableOptionIds.has(optionId)
    )
  ) as Record<string, TSelected>
}
