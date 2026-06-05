export type DefaultModifierWarningProduct = {
  id: string
  name: string
}

export type DefaultModifierWarningGroup = {
  id: string
  name: string
}

export type DefaultModifierWarningDefault = {
  product_id: string
  modifier_group_id: string
  is_enabled?: boolean | null
}

export type DefaultModifierWarningIncludedRule = {
  product_id: string
  modifier_group_id: string
  included_quantity: number | null
}

export type DefaultModifierIncludedSelectionWarning = {
  productId: string
  modifierGroupId: string
  modifierGroupName: string
  defaultCount: number
  includedCount: number
  message: string
}

export function getDefaultModifierIncludedSelectionWarnings({
  product,
  assignedModifierGroups,
  defaultModifierOptions,
  includedModifierGroupRules,
}: {
  product: DefaultModifierWarningProduct
  assignedModifierGroups: DefaultModifierWarningGroup[]
  defaultModifierOptions: DefaultModifierWarningDefault[]
  includedModifierGroupRules: DefaultModifierWarningIncludedRule[]
}): DefaultModifierIncludedSelectionWarning[] {
  const rulesByGroupId = new Map(
    includedModifierGroupRules
      .filter((rule) => rule.product_id === product.id)
      .map((rule) => [rule.modifier_group_id, rule])
  )

  return assignedModifierGroups.flatMap((group) => {
    const defaultCount = defaultModifierOptions.filter(
      (defaultOption) =>
        defaultOption.product_id === product.id &&
        defaultOption.modifier_group_id === group.id &&
        defaultOption.is_enabled !== false
    ).length
    const includedCount = Math.max(
      0,
      Number(rulesByGroupId.get(group.id)?.included_quantity ?? 0)
    )

    if (defaultCount <= includedCount) return []

    return [
      {
        productId: product.id,
        modifierGroupId: group.id,
        modifierGroupName: group.name,
        defaultCount,
        includedCount,
        message: `${product.name} has ${defaultCount} default ${group.name}, but only ${includedCount} included selections. Default selections beyond the included count will be charged.`,
      },
    ]
  })
}
