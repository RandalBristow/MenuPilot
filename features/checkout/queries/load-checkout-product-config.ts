import { supabaseAdmin } from "@/lib/supabase/admin"
import { resolveVariantsForProduct } from "@/features/product-configurator/utils/apply-effective-product-variants"
import type {
  CheckoutModifierGroupConfig,
  CheckoutModifierOptionConfig,
  CheckoutModifierOptionGroupConfig,
  CheckoutProductConfig,
} from "@/features/checkout/utils/validate-and-price-cart"

type RawVariantGroupOption = {
  id: string
  name: string
  base_price: number | string
  is_default: boolean
  is_enabled: boolean
  sort_order: number
}

type RawVariantGroup = {
  id: string
  variant_group_options: RawVariantGroupOption[] | null
}

type RawProductVariantGroup = {
  id: string
  is_enabled: boolean
  sort_order: number | null
  variant_groups: RawVariantGroup | RawVariantGroup[] | null
}

type RawVariantOptionOverride = {
  variant_group_option_id: string
  price_override: number | string | null
  is_enabled: boolean | null
  is_default: boolean | null
  sort_order: number | null
}

type RawModifierOptionGroup = {
  id: string
  name: string
  is_enabled: boolean
}

type RawModifierOption = {
  id: string
  name: string
  price_delta: number | string
  is_enabled: boolean
  sort_order: number
  modifier_option_groups: RawModifierOptionGroup | RawModifierOptionGroup[] | null
}

type RawModifierGroup = {
  id: string
  name: string
  is_required: boolean
  min_required: number
  max_allowed: number | null
  is_enabled: boolean
  supports_placement: boolean
  supports_multiplier: boolean
  min_multiplier: number | null
  max_multiplier: number | null
  multiplier_step: number | null
  modifier_options: RawModifierOption[] | null
}

type RawProductModifierGroup = {
  id: string
  modifier_group_id: string
  is_enabled: boolean
  sort_order: number
  modifier_groups: RawModifierGroup | RawModifierGroup[] | null
}

type RawModifierOptionOverride = {
  modifier_option_id: string
  price_delta_override: number | string | null
  is_enabled: boolean | null
}

type RawModifierAvailabilityRule = {
  variant_group_option_id: string
  modifier_group_id: string
  modifier_option_id: string
  is_available: boolean
  is_enabled: boolean
}

type RawVariantModifierOptionPriceOverride = {
  variant_group_option_id: string
  modifier_group_id: string
  modifier_option_id: string
  price_delta: number | string
  is_enabled: boolean
}

type RawIncludedModifierGroup = {
  modifier_group_id: string
  included_quantity: number
  charge_for_extra: boolean
}

type RawCheckoutProduct = {
  id: string
  name: string
  is_enabled: boolean
  base_price: number | string | null
  product_variant_groups: RawProductVariantGroup[] | null
  product_variant_option_overrides: RawVariantOptionOverride[] | null
  product_modifier_groups: RawProductModifierGroup[] | null
  product_modifier_option_overrides: RawModifierOptionOverride[] | null
  product_variant_modifier_option_availability_rules:
    | RawModifierAvailabilityRule[]
    | null
  product_variant_modifier_option_price_overrides:
    | RawVariantModifierOptionPriceOverride[]
    | null
  product_included_modifier_groups: RawIncludedModifierGroup[] | null
}

export type LoadCheckoutProductConfigInput = {
  businessId: string
  productIds: string[]
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0

  return typeof value === "number" ? value : Number(value)
}

function getFirstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
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

function mapModifierOption(
  option: RawModifierOption
): CheckoutModifierOptionConfig {
  const optionGroup = getFirstRelation(option.modifier_option_groups)
  const mappedOptionGroup: CheckoutModifierOptionGroupConfig | null = optionGroup
    ? {
        id: optionGroup.id,
        name: optionGroup.name,
        isEnabled: optionGroup.is_enabled,
      }
    : null

  return {
    id: option.id,
    name: option.name,
    priceDelta: toNumber(option.price_delta),
    isEnabled: option.is_enabled,
    optionGroup: mappedOptionGroup,
  }
}

function mapModifierGroups(
  product: RawCheckoutProduct
): CheckoutModifierGroupConfig[] {
  const includedByModifierGroupId = new Map(
    (product.product_included_modifier_groups ?? []).map((includedGroup) => [
      includedGroup.modifier_group_id,
      includedGroup,
    ])
  )

  return sortBySortOrder(product.product_modifier_groups ?? []).reduce<
    CheckoutModifierGroupConfig[]
  >((groups, assignment) => {
      const group = getFirstRelation(assignment.modifier_groups)

      if (!group) return groups

      const includedGroup = includedByModifierGroupId.get(group.id)

      groups.push({
        id: group.id,
        name: group.name,
        isAssignmentEnabled: assignment.is_enabled,
        isEnabled: group.is_enabled,
        isRequired: group.is_required,
        minRequired: group.min_required,
        maxAllowed: group.max_allowed,
        supportsPlacement: group.supports_placement,
        supportsMultiplier: group.supports_multiplier,
        minMultiplier: group.min_multiplier,
        maxMultiplier: group.max_multiplier,
        multiplierStep: group.multiplier_step,
        includedQuantity: includedGroup?.included_quantity,
        chargeForExtra: includedGroup?.charge_for_extra,
        options: sortBySortOrder(group.modifier_options ?? []).map(
          mapModifierOption
        ),
      })

      return groups
    }, [])
}

function mapProduct(product: RawCheckoutProduct): CheckoutProductConfig {
  const effectiveVariants = resolveVariantsForProduct(product).map(
    (variant) => ({
      id: variant.id,
      name: variant.name,
      basePrice: variant.base_price,
      isEnabled: variant.is_enabled,
    })
  )

  return {
    id: product.id,
    name: product.name,
    isEnabled: product.is_enabled,
    basePrice: toNumber(product.base_price),
    variants: effectiveVariants,
    modifierGroups: mapModifierGroups(product),
    modifierOptionOverrides: (
      product.product_modifier_option_overrides ?? []
    ).map((override) => ({
      modifierOptionId: override.modifier_option_id,
      priceDeltaOverride:
        override.price_delta_override === null
          ? null
          : toNumber(override.price_delta_override),
      isEnabled: override.is_enabled,
    })),
    variantModifierOptionAvailabilityRules: (
      product.product_variant_modifier_option_availability_rules ?? []
    ).map((rule) => ({
      variantGroupOptionId: rule.variant_group_option_id,
      modifierGroupId: rule.modifier_group_id,
      modifierOptionId: rule.modifier_option_id,
      isAvailable: rule.is_available,
      isEnabled: rule.is_enabled,
    })),
    variantModifierOptionPriceOverrides: (
      product.product_variant_modifier_option_price_overrides ?? []
    ).map((override) => ({
      variantGroupOptionId: override.variant_group_option_id,
      modifierGroupId: override.modifier_group_id,
      modifierOptionId: override.modifier_option_id,
      priceDelta: toNumber(override.price_delta),
      isEnabled: override.is_enabled,
    })),
  }
}

export async function loadCheckoutProductConfig({
  businessId,
  productIds,
}: LoadCheckoutProductConfigInput): Promise<CheckoutProductConfig[]> {
  const uniqueProductIds = [...new Set(productIds)]

  if (uniqueProductIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      `
      id,
      name,
      is_enabled,
      base_price,
      product_variant_groups (
        id,
        is_enabled,
        sort_order,
        variant_groups (
          id,
          variant_group_options (
            id,
            name,
            base_price,
            is_default,
            is_enabled,
            sort_order
          )
        )
      ),
      product_variant_option_overrides (
        variant_group_option_id,
        price_override,
        is_enabled,
        is_default,
        sort_order
      ),
      product_modifier_groups (
        id,
        modifier_group_id,
        is_enabled,
        sort_order,
        modifier_groups (
          id,
          name,
          is_required,
          min_required,
          max_allowed,
          is_enabled,
          supports_placement,
          supports_multiplier,
          min_multiplier,
          max_multiplier,
          multiplier_step,
          modifier_options (
            id,
            name,
            price_delta,
            is_enabled,
            sort_order,
            modifier_option_groups (
              id,
              name,
              is_enabled
            )
          )
        )
      ),
      product_modifier_option_overrides (
        modifier_option_id,
        price_delta_override,
        is_enabled
      ),
      product_variant_modifier_option_availability_rules (
        variant_group_option_id,
        modifier_group_id,
        modifier_option_id,
        is_available,
        is_enabled
      ),
      product_variant_modifier_option_price_overrides (
        variant_group_option_id,
        modifier_group_id,
        modifier_option_id,
        price_delta,
        is_enabled
      ),
      product_included_modifier_groups (
        modifier_group_id,
        included_quantity,
        charge_for_extra
      )
    `
    )
    .eq("business_id", businessId)
    .in("id", uniqueProductIds)

  if (error) {
    throw new Error(`Could not load checkout product config: ${error.message}`)
  }

  return ((data ?? []) as RawCheckoutProduct[]).map(mapProduct)
}
