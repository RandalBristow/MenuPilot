export type ModifierIncludedRuleOverride = {
  modifierGroupId: string
  includedSelectionCount: number
}

export function getModifierIncludedRuleOverride({
  modifierGroupId,
  overrides,
}: {
  modifierGroupId: string
  overrides?: ModifierIncludedRuleOverride[] | null
}) {
  return (
    overrides?.find(
      (override) => override.modifierGroupId === modifierGroupId
    ) ?? null
  )
}

export function resolveIncludedQuantity({
  modifierGroupId,
  productIncludedQuantity,
  overrides,
}: {
  modifierGroupId: string
  productIncludedQuantity: number
  overrides?: ModifierIncludedRuleOverride[] | null
}) {
  const override = getModifierIncludedRuleOverride({
    modifierGroupId,
    overrides,
  })

  return override ? override.includedSelectionCount : productIncludedQuantity
}
