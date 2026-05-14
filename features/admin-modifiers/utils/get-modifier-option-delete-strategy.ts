export type ModifierOptionDeleteUsage = {
  usedByProducts: boolean
  usedByOrders: boolean
}

export type ModifierOptionDeleteStrategy = "delete" | "disable"

export function getModifierOptionDeleteStrategy({
  usedByProducts,
  usedByOrders,
}: ModifierOptionDeleteUsage): ModifierOptionDeleteStrategy {
  return usedByProducts || usedByOrders ? "disable" : "delete"
}
