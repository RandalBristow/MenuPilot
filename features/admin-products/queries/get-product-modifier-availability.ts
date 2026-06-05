import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  type ProductAdminBusinessContextInput,
  resolveProductAdminBusinessContext,
} from "@/features/admin-products/utils/product-admin-business-context"
import type { VariantModifierOptionAvailabilityRule } from "@/features/admin-products/utils/variant-modifier-availability"
import type { VariantModifierOptionPriceOverride } from "@/features/product-configurator/utils/variant-modifier-pricing"

export type ProductModifierAvailabilityVariantOption = {
  id: string
  name: string
  is_enabled: boolean
  sort_order: number
}

export type ProductModifierAvailabilityVariantGroup = {
  id: string
  name: string
  options: ProductModifierAvailabilityVariantOption[]
} | null

export type ProductModifierAvailabilityOption = {
  id: string
  name: string
  price_delta: number
  price_delta_override: number | null
  is_enabled: boolean
  sort_order: number
  option_group: {
    id: string
    name: string
    sort_order: number
  } | null
}

export type ProductModifierAvailabilityGroup = {
  id: string
  name: string
  is_enabled: boolean
  options: ProductModifierAvailabilityOption[]
}

export type ProductModifierAvailabilityData = {
  businessName: string
  product: {
    id: string
    name: string
  }
  variantGroup: ProductModifierAvailabilityVariantGroup
  modifierGroup: ProductModifierAvailabilityGroup
  availabilityRules: VariantModifierOptionAvailabilityRule[]
  priceOverrides: VariantModifierOptionPriceOverride[]
}

type RawProductModifierAvailabilityOption = Omit<
  ProductModifierAvailabilityOption,
  "option_group" | "price_delta" | "price_delta_override"
> & {
  price_delta: number | string
  modifier_option_groups:
    | {
        id: string
        name: string
        sort_order: number
      }
    | {
        id: string
        name: string
        sort_order: number
      }[]
    | null
}

type ProductModifierOptionOverride = {
  modifier_option_id: string
  price_delta_override: number | string | null
  is_enabled: boolean | null
}

function sortBySortOrder<T extends { sort_order: number; name: string }>(
  items: T[]
) {
  return [...items].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}

function getFirstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export async function getProductModifierAvailabilityData({
  productId,
  modifierGroupId,
  businessContext = {},
}: {
  productId?: string
  modifierGroupId: string
  businessContext?: ProductAdminBusinessContextInput
}): Promise<ProductModifierAvailabilityData | null> {
  if (!productId) return null

  const business = await resolveProductAdminBusinessContext(businessContext)
  const businessId = business.id

  const [
    { data: product, error: productError },
    { data: modifierAssignment, error: modifierAssignmentError },
    { data: variantAssignment, error: variantAssignmentError },
    { data: availabilityRules, error: availabilityRulesError },
    { data: optionOverrides, error: optionOverridesError },
    { data: priceOverrides, error: priceOverridesError },
  ] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("id, name")
      .eq("business_id", businessId)
      .eq("id", productId)
      .single(),
    supabaseAdmin
      .from("product_modifier_groups")
      .select(
        `
        id,
        is_enabled,
        modifier_groups (
          id,
          name,
          is_enabled,
          modifier_options (
            id,
            name,
            price_delta,
            is_enabled,
            sort_order,
            modifier_option_groups (
              id,
              name,
              sort_order
            )
          )
        )
      `
      )
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .eq("modifier_group_id", modifierGroupId)
      .eq("is_enabled", true)
      .single(),
    supabaseAdmin
      .from("product_variant_groups")
      .select(
        `
        id,
        is_enabled,
        variant_groups (
          id,
          name,
          variant_group_options (
            id,
            name,
            is_enabled,
            sort_order
          )
        )
      `
      )
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .eq("is_enabled", true)
      .maybeSingle(),
    supabaseAdmin
      .from("product_variant_modifier_option_availability_rules")
      .select(
        `
        id,
        variant_group_option_id,
        modifier_group_id,
        modifier_option_id,
        is_available,
        is_enabled
      `
      )
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .eq("modifier_group_id", modifierGroupId),
    supabaseAdmin
      .from("product_modifier_option_overrides")
      .select(
        `
        modifier_option_id,
        price_delta_override,
        is_enabled
      `
      )
      .eq("business_id", businessId)
      .eq("product_id", productId),
    supabaseAdmin
      .from("product_variant_modifier_option_price_overrides")
      .select(
        `
        variant_group_option_id,
        modifier_group_id,
        modifier_option_id,
        price_delta,
        is_enabled
      `
      )
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .eq("modifier_group_id", modifierGroupId),
  ])

  if (productError || !product) return null
  if (modifierAssignmentError || !modifierAssignment) return null
  if (variantAssignmentError) {
    throw new Error(`Could not load product variant group: ${variantAssignmentError.message}`)
  }
  if (availabilityRulesError) {
    throw new Error(
      `Could not load modifier availability rules: ${availabilityRulesError.message}`
    )
  }
  if (optionOverridesError) {
    throw new Error(
      `Could not load modifier option overrides: ${optionOverridesError.message}`
    )
  }
  if (priceOverridesError) {
    throw new Error(
      `Could not load variant modifier price overrides: ${priceOverridesError.message}`
    )
  }

  const modifierGroup = getFirstRelation(
    (
      modifierAssignment as {
        modifier_groups:
          | {
              id: string
              name: string
              is_enabled: boolean
              modifier_options: RawProductModifierAvailabilityOption[] | null
            }
          | {
              id: string
              name: string
              is_enabled: boolean
              modifier_options: RawProductModifierAvailabilityOption[] | null
            }[]
          | null
      }
    ).modifier_groups
  )

  if (!modifierGroup || !modifierGroup.is_enabled) return null
  const optionOverridesByOptionId = new Map(
    ((optionOverrides ?? []) as ProductModifierOptionOverride[]).map(
      (override) => [override.modifier_option_id, override]
    )
  )

  const variantGroup = getFirstRelation(
    (
      variantAssignment as
        | {
            variant_groups:
              | {
                  id: string
                  name: string
                  variant_group_options:
                    | ProductModifierAvailabilityVariantOption[]
                    | null
                }
              | {
                  id: string
                  name: string
                  variant_group_options:
                    | ProductModifierAvailabilityVariantOption[]
                    | null
                }[]
              | null
          }
        | null
        | undefined
    )?.variant_groups
  )

  return {
    businessName: business.name,
    product: {
      id: product.id as string,
      name: product.name as string,
    },
    variantGroup: variantGroup
      ? {
          id: variantGroup.id,
          name: variantGroup.name,
          options: sortBySortOrder(
            (variantGroup.variant_group_options ?? []).filter(
              (option) => option.is_enabled
            )
          ),
        }
      : null,
    modifierGroup: {
      id: modifierGroup.id,
      name: modifierGroup.name,
      is_enabled: modifierGroup.is_enabled,
      options: sortBySortOrder(
        (modifierGroup.modifier_options ?? [])
          .filter((option) => {
            const override = optionOverridesByOptionId.get(option.id)

            return option.is_enabled && override?.is_enabled !== false
          })
          .map((option) => {
            const override = optionOverridesByOptionId.get(option.id)
            const priceOverride = override?.price_delta_override

            return {
              ...option,
              price_delta:
                typeof option.price_delta === "number"
                  ? option.price_delta
                  : Number(option.price_delta),
              price_delta_override:
                priceOverride === null || priceOverride === undefined
                  ? null
                  : typeof priceOverride === "number"
                    ? priceOverride
                    : Number(priceOverride),
              option_group: getFirstRelation(option.modifier_option_groups),
            }
          })
      ),
    },
    availabilityRules:
      (availabilityRules ?? []) as VariantModifierOptionAvailabilityRule[],
    priceOverrides: ((priceOverrides ?? []) as Array<{
      variant_group_option_id: string
      modifier_group_id: string
      modifier_option_id: string
      price_delta: number | string
      is_enabled: boolean
    }>).map((override) => ({
      ...override,
      price_delta:
        typeof override.price_delta === "number"
          ? override.price_delta
          : Number(override.price_delta),
    })),
  }
}
