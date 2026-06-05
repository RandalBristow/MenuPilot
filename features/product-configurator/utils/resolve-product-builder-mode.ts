export type ProductBuilderMode =
  | "pizza"
  | "generic-configurable"
  | "simple-variant"
  | "simple-quantity"
  | "unsupported"

type BuilderModeProduct = {
  builder_template?: string | null
  has_variants?: boolean | null
  variants?: Array<{
    is_enabled?: boolean | null
  }> | null
  product_modifier_groups?: Array<{
    is_enabled?: boolean | null
    modifier_groups?: {
      is_enabled?: boolean | null
    } | null
  }> | null
}

function hasEnabledModifierGroups(product: BuilderModeProduct) {
  return (product.product_modifier_groups ?? []).some(
    (assignment) =>
      assignment.is_enabled !== false &&
      assignment.modifier_groups?.is_enabled !== false &&
      assignment.modifier_groups !== null &&
      assignment.modifier_groups !== undefined
  )
}

function hasEffectiveVariants(product: BuilderModeProduct) {
  if (product.has_variants) return true

  return (product.variants ?? []).some((variant) => variant.is_enabled !== false)
}

export function resolveProductBuilderMode(
  product: BuilderModeProduct
): ProductBuilderMode {
  if (product.builder_template === "pizza") return "pizza"
  if (product.builder_template === "combo") return "unsupported"

  if (hasEnabledModifierGroups(product)) {
    return "generic-configurable"
  }

  if (hasEffectiveVariants(product)) {
    return "simple-variant"
  }

  return "simple-quantity"
}
