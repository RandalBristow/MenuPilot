export type ModifierOptionOverride = {
  modifier_option_id: string
  price_delta_override: number | string | null
  prep_time_delta_minutes_override?: number | null
  is_enabled: boolean | null
  sort_order: number | null
}

export type ModifierOptionWithOverrides = {
  id: string
  price_delta: number | string
  prep_time_delta_minutes?: number | null
  is_enabled: boolean
  sort_order: number
}

export type ModifierGroupWithOverrides<TOption extends ModifierOptionWithOverrides> = {
  modifier_options?: TOption[] | null
}

export type ProductModifierOverrideSources = {
  product_modifier_groups?: Array<{
    modifier_groups?:
      | ModifierGroupWithOverrides<ModifierOptionWithOverrides>
      | ModifierGroupWithOverrides<ModifierOptionWithOverrides>[]
      | null
  }> | null
  product_modifier_option_overrides?: ModifierOptionOverride[] | null
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value)
}

function sortBySortOrder<T extends { sort_order: number; name?: string }>(
  items: T[]
) {
  return [...items].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return (first.name ?? "").localeCompare(second.name ?? "")
  })
}

function getFirstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export function applyEffectiveModifierOptions<
  TOption extends ModifierOptionWithOverrides,
>(options: TOption[] | null | undefined, overrides: ModifierOptionOverride[]) {
  const overridesByOptionId = new Map(
    overrides.map((override) => [override.modifier_option_id, override])
  )

  return sortBySortOrder(
    (options ?? []).map((option) => {
      const override = overridesByOptionId.get(option.id)

      return {
        ...option,
        price_delta:
          override?.price_delta_override === null ||
          override?.price_delta_override === undefined
            ? toNumber(option.price_delta)
            : toNumber(override.price_delta_override),
        prep_time_delta_minutes:
          override?.prep_time_delta_minutes_override ??
          option.prep_time_delta_minutes ??
          null,
        is_enabled: override?.is_enabled ?? option.is_enabled,
        sort_order: override?.sort_order ?? option.sort_order,
      }
    })
  )
}

export function applyEffectiveModifierGroups<
  TProduct extends ProductModifierOverrideSources,
>(product: TProduct) {
  const overrides = product.product_modifier_option_overrides ?? []

  return {
    ...product,
    product_modifier_groups: (product.product_modifier_groups ?? []).map(
      (assignment) => {
        const group = getFirstRelation(assignment.modifier_groups)

        if (!group) return assignment

        return {
          ...assignment,
          modifier_groups: {
            ...group,
            modifier_options: applyEffectiveModifierOptions(
              group.modifier_options,
              overrides
            ),
          },
        }
      }
    ),
  }
}
