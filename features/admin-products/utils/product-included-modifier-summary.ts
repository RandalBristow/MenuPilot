export type ProductIncludedModifierSummaryRule = {
  included_quantity: number
  charge_for_extra: boolean
} | null

export function getIncludedSummary(
  includedRule: ProductIncludedModifierSummaryRule | undefined
) {
  if (!includedRule || includedRule.included_quantity <= 0) return null

  return `Included: ${includedRule.included_quantity} ${
    includedRule.included_quantity === 1 ? "selection" : "selections"
  } - Extras: ${includedRule.charge_for_extra ? "charged" : "free"}`
}
