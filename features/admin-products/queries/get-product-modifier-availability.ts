import { supabaseAdmin } from "@/lib/supabase/admin"
import type { VariantModifierOptionAvailabilityRule } from "@/features/admin-products/utils/variant-modifier-availability"

const BUSINESS_SLUG = "pronto-demo"

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
  is_enabled: boolean
  sort_order: number
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
}: {
  productId?: string
  modifierGroupId: string
}): Promise<ProductModifierAvailabilityData | null> {
  if (!productId) return null

  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, name")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (businessError || !business) {
    throw new Error("Could not load product business.")
  }

  const businessId = business.id as string

  const [
    { data: product, error: productError },
    { data: modifierAssignment, error: modifierAssignmentError },
    { data: variantAssignment, error: variantAssignmentError },
    { data: availabilityRules, error: availabilityRulesError },
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
            is_enabled,
            sort_order
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

  const modifierGroup = getFirstRelation(
    (
      modifierAssignment as {
        modifier_groups:
          | {
              id: string
              name: string
              is_enabled: boolean
              modifier_options: ProductModifierAvailabilityOption[] | null
            }
          | {
              id: string
              name: string
              is_enabled: boolean
              modifier_options: ProductModifierAvailabilityOption[] | null
            }[]
          | null
      }
    ).modifier_groups
  )

  if (!modifierGroup || !modifierGroup.is_enabled) return null

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
    businessName: business.name as string,
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
        (modifierGroup.modifier_options ?? []).filter(
          (option) => option.is_enabled
        )
      ),
    },
    availabilityRules:
      (availabilityRules ?? []) as VariantModifierOptionAvailabilityRule[],
  }
}
