import {
  normalizeBusinessPricingSettings,
  type BusinessPricingSettings,
  type RawBusinessPricingSettings,
} from "@/lib/pricing/business-pricing-settings"

export type ConfiguredProductVariant = {
  id: string
  basePrice?: number | string | null
  base_price?: number | string | null
}

export type ConfiguredProductModifierOption = {
  id: string
  priceDelta?: number | string | null
  price_delta?: number | string | null
}

export type ConfiguredProductModifierGroup = {
  id: string
  includedQuantity?: number | null
  included_quantity?: number | null
  chargeForExtra?: boolean | null
  charge_for_extra?: boolean | null
  options?: ConfiguredProductModifierOption[] | null
  modifier_options?: ConfiguredProductModifierOption[] | null
}

export type ConfiguredProductSelectedModifier = {
  optionId: string
  multiplier?: number | null
  placement?: "left" | "whole" | "right"
}

export type ConfiguredProductDefaultModifierOption = {
  modifierOptionId?: string
  modifier_option_id?: string
  placement?: "left" | "whole" | "right" | null
  multiplier?: number | string | null
  quantity?: number | string | null
  isEnabled?: boolean | null
  is_enabled?: boolean | null
}

export type ConfiguredProductModifierOptionOverride = {
  modifierOptionId?: string
  modifier_option_id?: string
  priceDeltaOverride?: number | string | null
  price_delta_override?: number | string | null
  isEnabled?: boolean | null
  is_enabled?: boolean | null
}

export type ConfiguredProductVariantModifierOptionPriceOverride = {
  variantGroupOptionId?: string
  variant_group_option_id?: string
  modifierGroupId?: string
  modifier_group_id?: string
  modifierOptionId?: string
  modifier_option_id?: string
  priceDelta?: number | string | null
  price_delta?: number | string | null
  isEnabled?: boolean | null
  is_enabled?: boolean | null
}

export type PricedConfiguredProductModifier = ConfiguredProductSelectedModifier & {
  groupId: string
  optionId: string
  unitPrice: number
  priceDelta: number
  pricingUnits: number
  totalUnits: number
  defaultUnits: number
  includedUnits: number
  chargedUnits: number
  linePrice: number
}

export type PricedConfiguredProductModifierGroup = {
  groupId: string
  includedQuantity: number
  chargeForExtra: boolean
  selectedUnits: number
  defaultUnits: number
  includedUnitsUsed: number
  chargedUnits: number
}

export type PriceConfiguredProductInput = {
  productBasePrice: number | string | null | undefined
  builderTemplate?: string | null
  pricingSettings?: RawBusinessPricingSettings | BusinessPricingSettings | null
  selectedVariant?: ConfiguredProductVariant | null
  selectedModifiers: Record<string, ConfiguredProductSelectedModifier>
  modifierGroups: ConfiguredProductModifierGroup[]
  productDefaultModifierOptions?: ConfiguredProductDefaultModifierOption[] | null
  modifierOptionOverrides?: ConfiguredProductModifierOptionOverride[] | null
  variantModifierOptionPriceOverrides?:
    | ConfiguredProductVariantModifierOptionPriceOverride[]
    | null
  quantity?: number | null
}

export type PriceConfiguredProductResult = {
  unitPrice: number
  lineTotal: number
  quantity: number
  basePrice: number
  pricedSelectedModifiers: Record<string, PricedConfiguredProductModifier>
  modifierGroups: Record<string, PricedConfiguredProductModifierGroup>
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined) return fallback

  const parsedValue = typeof value === "number" ? value : Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

function getOptionPrice(option: ConfiguredProductModifierOption) {
  return toNumber(option.priceDelta ?? option.price_delta)
}

function getGroupOptions(group: ConfiguredProductModifierGroup) {
  return group.options ?? group.modifier_options ?? []
}

function getIncludedQuantity(group: ConfiguredProductModifierGroup) {
  return Math.max(
    0,
    toNumber(group.includedQuantity ?? group.included_quantity)
  )
}

function getChargeForExtra(group: ConfiguredProductModifierGroup) {
  return group.chargeForExtra ?? group.charge_for_extra ?? true
}

function getPlacementWeight(
  placement: ConfiguredProductSelectedModifier["placement"] | null | undefined
) {
  return placement === "left" || placement === "right" ? 0.5 : 1
}

function floorToCent(value: number) {
  return Math.floor((value + Number.EPSILON) * 100) / 100
}

function applyPricingRounding(
  value: number,
  settings: BusinessPricingSettings
) {
  if (settings.pizzaHalfToppingRoundingMode === "floor_to_cent") {
    return floorToCent(value)
  }

  return value
}

function getPizzaPlacementPolicy({
  builderTemplate,
  pricingSettings,
}: {
  builderTemplate?: string | null
  pricingSettings?: RawBusinessPricingSettings | BusinessPricingSettings | null
}) {
  const settings = normalizeBusinessPricingSettings(pricingSettings)
  const isPizza = builderTemplate === "pizza"

  return {
    settings,
    pricingUsesPlacementWeight:
      isPizza && settings.pizzaHalfToppingPricingEnabled,
    includedUsesPlacementWeight:
      isPizza && settings.pizzaHalfToppingIncludedWeightEnabled,
  }
}

function getDefaultModifierOptionUnits(
  defaultOptions: ConfiguredProductDefaultModifierOption[] | null | undefined,
  includedUsesPlacementWeight: boolean
) {
  return (defaultOptions ?? []).reduce<Record<string, number>>(
    (unitsByOptionId, option) => {
      if ((option.isEnabled ?? option.is_enabled) === false) {
        return unitsByOptionId
      }

      const optionId = option.modifierOptionId ?? option.modifier_option_id
      if (!optionId) return unitsByOptionId

      const quantity = Math.max(1, toNumber(option.quantity, 1))
      const multiplier = Math.max(1, toNumber(option.multiplier, 1))
      const placementWeight = includedUsesPlacementWeight
        ? getPlacementWeight(option.placement)
        : 1

      return {
        ...unitsByOptionId,
        [optionId]:
          (unitsByOptionId[optionId] ?? 0) +
          quantity * multiplier * placementWeight,
      }
    },
    {}
  )
}

function getOverrideOptionId(
  override:
    | ConfiguredProductModifierOptionOverride
    | ConfiguredProductVariantModifierOptionPriceOverride
) {
  return override.modifierOptionId ?? override.modifier_option_id
}

function getProductModifierOptionOverride({
  optionId,
  modifierOptionOverrides,
}: {
  optionId: string
  modifierOptionOverrides?: ConfiguredProductModifierOptionOverride[] | null
}) {
  return (modifierOptionOverrides ?? []).find(
    (override) => getOverrideOptionId(override) === optionId
  )
}

function getVariantModifierOptionPriceOverride({
  selectedVariantId,
  modifierGroupId,
  modifierOptionId,
  variantModifierOptionPriceOverrides,
}: {
  selectedVariantId: string | null
  modifierGroupId: string
  modifierOptionId: string
  variantModifierOptionPriceOverrides?:
    | ConfiguredProductVariantModifierOptionPriceOverride[]
    | null
}) {
  if (!selectedVariantId) return null

  return (
    variantModifierOptionPriceOverrides?.find(
      (override) =>
        (override.isEnabled ?? override.is_enabled) !== false &&
        (override.variantGroupOptionId ?? override.variant_group_option_id) ===
          selectedVariantId &&
        (override.modifierGroupId ?? override.modifier_group_id) ===
          modifierGroupId &&
        getOverrideOptionId(override) === modifierOptionId
    ) ?? null
  )
}

function resolveModifierOptionPrice({
  option,
  modifierGroupId,
  selectedVariantId,
  modifierOptionOverrides,
  variantModifierOptionPriceOverrides,
}: {
  option: ConfiguredProductModifierOption
  modifierGroupId: string
  selectedVariantId: string | null
  modifierOptionOverrides?: ConfiguredProductModifierOptionOverride[] | null
  variantModifierOptionPriceOverrides?:
    | ConfiguredProductVariantModifierOptionPriceOverride[]
    | null
}) {
  const productOverride = getProductModifierOptionOverride({
    optionId: option.id,
    modifierOptionOverrides,
  })

  if ((productOverride?.isEnabled ?? productOverride?.is_enabled) === false) {
    return null
  }

  const inheritedPrice =
    productOverride?.priceDeltaOverride ??
    productOverride?.price_delta_override ??
    getOptionPrice(option)
  const variantOverride = getVariantModifierOptionPriceOverride({
    selectedVariantId,
    modifierGroupId,
    modifierOptionId: option.id,
    variantModifierOptionPriceOverrides,
  })

  return toNumber(
    variantOverride?.priceDelta ??
      variantOverride?.price_delta ??
      inheritedPrice
  )
}

export function priceConfiguredProduct({
  productBasePrice,
  builderTemplate,
  pricingSettings,
  selectedVariant,
  selectedModifiers,
  modifierGroups,
  productDefaultModifierOptions,
  modifierOptionOverrides,
  variantModifierOptionPriceOverrides,
  quantity = 1,
}: PriceConfiguredProductInput): PriceConfiguredProductResult {
  const selectedVariantId = selectedVariant?.id ?? null
  const basePrice = toNumber(
    selectedVariant?.basePrice ?? selectedVariant?.base_price ?? productBasePrice
  )
  const placementPolicy = getPizzaPlacementPolicy({
    builderTemplate,
    pricingSettings,
  })
  const defaultModifierOptionUnits = getDefaultModifierOptionUnits(
    productDefaultModifierOptions,
    placementPolicy.includedUsesPlacementWeight
  )
  const pricedSelectedModifiers = new Map<
    string,
    PricedConfiguredProductModifier
  >()
  const pricedGroups = new Map<string, PricedConfiguredProductModifierGroup>()

  modifierGroups.forEach((group) => {
    const selectedWithPrices = Object.values(selectedModifiers)
      .filter((selected) =>
        getGroupOptions(group).some((option) => option.id === selected.optionId)
      )
      .map((selected) => {
        const option = getGroupOptions(group).find(
          (modifierOption) => modifierOption.id === selected.optionId
        )
        if (!option) return null

        const unitPrice = resolveModifierOptionPrice({
          option,
          modifierGroupId: group.id,
          selectedVariantId,
          modifierOptionOverrides,
          variantModifierOptionPriceOverrides,
        })
        if (unitPrice === null) return null

        const multiplier = Math.max(0, toNumber(selected.multiplier, 1))
        const placementWeight = getPlacementWeight(selected.placement)

        return {
          selected,
          option,
          multiplier,
          pricingUnits:
            multiplier *
            (placementPolicy.pricingUsesPlacementWeight ? placementWeight : 1),
          totalUnits:
            multiplier *
            (placementPolicy.includedUsesPlacementWeight ? placementWeight : 1),
          unitPrice,
          defaultUnits: Math.max(
            0,
            defaultModifierOptionUnits[selected.optionId] ?? 0
          ),
        }
      })
      .filter(Boolean) as Array<{
      selected: ConfiguredProductSelectedModifier
      option: ConfiguredProductModifierOption
      multiplier: number
      pricingUnits: number
      totalUnits: number
      unitPrice: number
      defaultUnits: number
    }>

    const includedQuantity = getIncludedQuantity(group)
    const chargeForExtra = getChargeForExtra(group)
    let remainingIncludedUnits = includedQuantity
    let groupIncludedUnitsUsed = 0
    let groupChargedUnits = 0
    let groupDefaultUnits = 0
    let groupSelectedUnits = 0

    selectedWithPrices.forEach((item) => {
      const totalUnits = item.totalUnits
      const defaultUnits = Math.min(totalUnits, item.defaultUnits)
      const includedUnits = chargeForExtra
        ? Math.min(totalUnits, Math.max(remainingIncludedUnits, 0))
        : totalUnits
      const chargedUnits = chargeForExtra ? totalUnits - includedUnits : 0
      const chargedFraction = totalUnits > 0 ? chargedUnits / totalUnits : 0
      const chargedPricingUnits = item.pricingUnits * chargedFraction
      const linePrice = applyPricingRounding(
        chargedPricingUnits * item.unitPrice,
        placementPolicy.settings
      )

      pricedSelectedModifiers.set(item.selected.optionId, {
        ...item.selected,
        optionId: item.selected.optionId,
        groupId: group.id,
        multiplier: item.multiplier,
        unitPrice: item.unitPrice,
        priceDelta: linePrice,
        pricingUnits: item.pricingUnits,
        totalUnits,
        defaultUnits,
        includedUnits,
        chargedUnits,
        linePrice,
      })

      groupSelectedUnits += totalUnits
      groupDefaultUnits += defaultUnits
      groupIncludedUnitsUsed += includedUnits
      groupChargedUnits += chargedUnits
      remainingIncludedUnits -= includedUnits
    })

    pricedGroups.set(group.id, {
      groupId: group.id,
      includedQuantity,
      chargeForExtra,
      selectedUnits: groupSelectedUnits,
      defaultUnits: groupDefaultUnits,
      includedUnitsUsed: groupIncludedUnitsUsed,
      chargedUnits: groupChargedUnits,
    })
  })

  const modifierTotal = Array.from(pricedSelectedModifiers.values()).reduce(
    (sum, modifier) => sum + modifier.linePrice,
    0
  )
  const unitPrice = basePrice + modifierTotal
  const normalizedQuantity = Math.max(1, toNumber(quantity, 1))

  return {
    unitPrice,
    lineTotal: unitPrice * normalizedQuantity,
    quantity: normalizedQuantity,
    basePrice,
    pricedSelectedModifiers: Object.fromEntries(pricedSelectedModifiers),
    modifierGroups: Object.fromEntries(pricedGroups),
  }
}
