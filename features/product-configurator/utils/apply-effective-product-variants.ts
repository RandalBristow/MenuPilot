import {
  resolveEffectiveVariants,
  type VariantGroupOption,
  type VariantOptionOverride,
} from "./resolve-effective-variants"

type RawVariantGroup = {
  id: string
  variant_group_options?: VariantGroupOption[] | null
}

type RawProductVariantGroup = {
  id: string
  is_enabled: boolean
  sort_order?: number | null
  variant_groups?: RawVariantGroup | RawVariantGroup[] | null
}

export type ProductWithVariantSources = {
  product_variant_groups?: RawProductVariantGroup[] | null
  product_variant_option_overrides?: VariantOptionOverride[] | null
}

function getFirstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export function resolveVariantsForProduct(
  product: ProductWithVariantSources
) {
  const attachedVariantGroups = (product.product_variant_groups ?? [])
    .map((assignment) => {
      const variantGroup = getFirstRelation(assignment.variant_groups)

      if (!variantGroup) return null

      return {
        id: variantGroup.id,
        is_enabled: assignment.is_enabled,
        sort_order: assignment.sort_order ?? 0,
        variant_group_options: variantGroup.variant_group_options ?? [],
      }
    })
    .filter((group): group is NonNullable<typeof group> => group !== null)

  return resolveEffectiveVariants({
    attachedVariantGroups,
    variantOptionOverrides: product.product_variant_option_overrides,
  })
}

export function applyEffectiveVariants<T extends ProductWithVariantSources>(
  product: T
) {
  return {
    ...product,
    variants: resolveVariantsForProduct(product),
  }
}
