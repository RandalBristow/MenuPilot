export type VariantGroupOption = {
  id: string
  name: string
  base_price: number | string
  is_default: boolean
  is_enabled: boolean
  sort_order: number
}

export type AttachedVariantGroup = {
  id: string
  is_enabled: boolean
  sort_order?: number
  variant_group_options: VariantGroupOption[]
}

export type VariantOptionOverride = {
  variant_group_option_id: string
  price_override: number | string | null
  is_enabled: boolean | null
  is_default: boolean | null
  sort_order: number | null
}

export type EffectiveVariant = {
  id: string
  source_type: "variant_group_option"
  name: string
  base_price: number
  is_default: boolean
  is_enabled: boolean
  sort_order: number
}

type ResolveEffectiveVariantsInput = {
  attachedVariantGroups?: AttachedVariantGroup[] | null
  variantOptionOverrides?: VariantOptionOverride[] | null
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value)
}

function sortEffectiveVariants(variants: EffectiveVariant[]) {
  return [...variants].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}

function normalizeDefault(variants: EffectiveVariant[]) {
  const sortedVariants = sortEffectiveVariants(variants)
  const defaultIndex = sortedVariants.findIndex((variant) => variant.is_default)

  if (defaultIndex < 0) {
    return sortedVariants.map((variant, index) => ({
      ...variant,
      is_default: index === 0,
    }))
  }

  return sortedVariants.map((variant, index) => ({
    ...variant,
    is_default: index === defaultIndex,
  }))
}

export function resolveEffectiveVariants({
  attachedVariantGroups,
  variantOptionOverrides,
}: ResolveEffectiveVariantsInput) {
  const enabledVariantGroups = (attachedVariantGroups ?? []).filter(
    (group) => group.is_enabled
  )

  const overridesByOptionId = new Map(
    (variantOptionOverrides ?? []).map((override) => [
      override.variant_group_option_id,
      override,
    ])
  )
  const effectiveVariants = enabledVariantGroups.flatMap((group) =>
    group.variant_group_options
      .filter((option) => {
        const override = overridesByOptionId.get(option.id)

        return option.is_enabled && override?.is_enabled !== false
      })
      .map((option) => {
        const override = overridesByOptionId.get(option.id)

        return {
          id: option.id,
          source_type: "variant_group_option" as const,
          name: option.name,
          base_price:
            override?.price_override === null ||
            override?.price_override === undefined
              ? toNumber(option.base_price)
              : toNumber(override.price_override),
          is_default:
            override?.is_default === null ||
            override?.is_default === undefined
              ? option.is_default
              : override.is_default,
          is_enabled: true,
          sort_order: override?.sort_order ?? option.sort_order,
        }
      })
  )

  return normalizeDefault(effectiveVariants)
}
