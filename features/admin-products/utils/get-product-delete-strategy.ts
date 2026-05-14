export type ProductDeleteStrategy = "delete" | "disable"

export function getProductDeleteStrategy(hasOrderUsage: boolean): ProductDeleteStrategy {
  return hasOrderUsage ? "disable" : "delete"
}
