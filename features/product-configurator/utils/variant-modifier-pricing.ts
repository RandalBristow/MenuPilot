export type VariantModifierOptionPriceOverride = {
  variant_group_option_id: string
  modifier_group_id: string
  modifier_option_id: string
  price_delta: number | string
  is_enabled: boolean
}

export function toPriceNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null

  const parsedValue = typeof value === "number" ? value : Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

export function getVariantModifierOptionPriceOverride({
  selectedVariantId,
  modifierGroupId,
  modifierOptionId,
  priceOverrides,
}: {
  selectedVariantId: string | null | undefined
  modifierGroupId: string
  modifierOptionId: string
  priceOverrides: VariantModifierOptionPriceOverride[] | null | undefined
}) {
  if (!selectedVariantId) return null

  return (
    priceOverrides?.find(
      (override) =>
        override.is_enabled &&
        override.variant_group_option_id === selectedVariantId &&
        override.modifier_group_id === modifierGroupId &&
        override.modifier_option_id === modifierOptionId
    ) ?? null
  )
}

export function resolveVariantModifierOptionPrice({
  selectedVariantId,
  modifierGroupId,
  modifierOptionId,
  inheritedPriceDelta,
  priceOverrides,
}: {
  selectedVariantId: string | null | undefined
  modifierGroupId: string
  modifierOptionId: string
  inheritedPriceDelta: number | string
  priceOverrides: VariantModifierOptionPriceOverride[] | null | undefined
}) {
  const override = getVariantModifierOptionPriceOverride({
    selectedVariantId,
    modifierGroupId,
    modifierOptionId,
    priceOverrides,
  })
  const overridePrice = override ? toPriceNumber(override.price_delta) : null

  return overridePrice ?? toPriceNumber(inheritedPriceDelta) ?? 0
}

export function applyVariantModifierOptionPrices<
  TGroup extends {
    id: string
    modifier_options: Array<TOption>
  },
  TOption extends {
    id: string
    price_delta: number | string
  },
>({
  selectedVariantId,
  modifierGroups,
  priceOverrides,
}: {
  selectedVariantId: string | null | undefined
  modifierGroups: TGroup[]
  priceOverrides: VariantModifierOptionPriceOverride[] | null | undefined
}) {
  return modifierGroups.map((group) => ({
    ...group,
    modifier_options: group.modifier_options.map((option) => ({
      ...option,
      price_delta: resolveVariantModifierOptionPrice({
        selectedVariantId,
        modifierGroupId: group.id,
        modifierOptionId: option.id,
        inheritedPriceDelta: option.price_delta,
        priceOverrides,
      }),
    })),
  }))
}
