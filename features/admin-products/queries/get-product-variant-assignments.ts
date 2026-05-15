import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductManagementData,
  type ProductManagementData,
} from "@/features/admin-products/queries/get-product-management-data"

const BUSINESS_SLUG = "pronto-demo"

export type AssignableVariantGroup = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  sort_order: number
  optionCount: number
}

export type VariantGroupOptionOverride = {
  id: string | null
  variant_group_option_id: string
  price_override: number | null
  prep_time_minutes_override: number | null
  is_enabled: boolean | null
  is_default: boolean | null
  sort_order: number | null
}

export type AssignedVariantGroupOption = {
  id: string
  name: string
  base_price: number
  prep_time_minutes: number | null
  is_default: boolean
  is_enabled: boolean
  sort_order: number
  override: VariantGroupOptionOverride | null
}

export type ProductVariantGroupAssignment = {
  id: string
  product_id: string
  variant_group_id: string
  is_enabled: boolean
  sort_order: number
  variantGroup: AssignableVariantGroup & {
    options: AssignedVariantGroupOption[]
  }
}

export type ProductVariantAssignmentData = {
  businessName: string
  menuGroups: ProductManagementData["menuGroups"]
  products: ProductManagementData["products"]
  selectedProductId: string | null
  selectedProductName: string | null
  attachedGroups: ProductVariantGroupAssignment[]
  availableGroups: AssignableVariantGroup[]
}

async function getBusinessId() {
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (error || !business) {
    throw new Error("Could not load product business.")
  }

  return business.id as string
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

function sortAssignments(assignments: ProductVariantGroupAssignment[]) {
  return [...assignments].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.variantGroup.name.localeCompare(second.variantGroup.name)
  })
}

function getFirstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

async function getAssignableVariantGroups(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("variant_groups")
    .select(
      `
      id,
      name,
      description,
      is_enabled,
      sort_order,
      variant_group_options (
        id
      )
    `
    )
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Could not load variant groups: ${error.message}`)
  }

  return sortBySortOrder(
    ((data ?? []) as Array<{
      id: string
      name: string
      description: string | null
      is_enabled: boolean
      sort_order: number
      variant_group_options: { id: string }[] | null
    }>).map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      is_enabled: group.is_enabled,
      sort_order: group.sort_order,
      optionCount: group.variant_group_options?.length ?? 0,
    }))
  )
}

async function getAttachedVariantGroups(
  businessId: string,
  productId: string | null
) {
  if (!productId) return []

  const { data, error } = await supabaseAdmin
    .from("product_variant_groups")
    .select(
      `
      id,
      product_id,
      variant_group_id,
      is_enabled,
      sort_order,
      variant_groups (
        id,
        name,
        description,
        is_enabled,
        sort_order,
        variant_group_options (
          id,
          name,
          base_price,
          prep_time_minutes,
          is_default,
          is_enabled,
          sort_order
        )
      )
    `
    )
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Could not load variant assignments: ${error.message}`)
  }

  const rows = (data ?? []) as unknown as Array<{
      id: string
      product_id: string
      variant_group_id: string
      is_enabled: boolean
      sort_order: number
      variant_groups:
        | {
            id: string
            name: string
            description: string | null
            is_enabled: boolean
            sort_order: number
            variant_group_options: {
              id: string
              name: string
              base_price: number
              prep_time_minutes: number | null
              is_default: boolean
              is_enabled: boolean
              sort_order: number
            }[] | null
          }
        | {
            id: string
            name: string
            description: string | null
            is_enabled: boolean
            sort_order: number
            variant_group_options: {
              id: string
              name: string
              base_price: number
              prep_time_minutes: number | null
              is_default: boolean
              is_enabled: boolean
              sort_order: number
            }[] | null
          }[]
        | null
    }>

  return sortAssignments(
    rows
      .map((assignment): ProductVariantGroupAssignment | null => {
        const variantGroup = getFirstRelation(assignment.variant_groups)

        if (!variantGroup) return null

        return {
          id: assignment.id,
          product_id: assignment.product_id,
          variant_group_id: assignment.variant_group_id,
          is_enabled: assignment.is_enabled,
          sort_order: assignment.sort_order,
          variantGroup: {
            id: variantGroup.id,
            name: variantGroup.name,
            description: variantGroup.description,
            is_enabled: variantGroup.is_enabled,
            sort_order: variantGroup.sort_order,
            optionCount:
              variantGroup.variant_group_options?.length ?? 0,
            options: sortBySortOrder(
              (variantGroup.variant_group_options ?? []).map((option) => ({
                id: option.id,
                name: option.name,
                base_price: Number(option.base_price),
                prep_time_minutes: option.prep_time_minutes,
                is_default: option.is_default,
                is_enabled: option.is_enabled,
                sort_order: option.sort_order,
                override: null,
              }))
            ),
          },
        }
      })
      .filter(
        (assignment): assignment is ProductVariantGroupAssignment =>
          assignment !== null
      )
  )
}

async function getVariantOptionOverrides(
  businessId: string,
  productId: string | null
) {
  if (!productId) return []

  const { data, error } = await supabaseAdmin
    .from("product_variant_option_overrides")
    .select(
      `
      id,
      variant_group_option_id,
      price_override,
      prep_time_minutes_override,
      is_enabled,
      is_default,
      sort_order
    `
    )
    .eq("business_id", businessId)
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not load variant option overrides: ${error.message}`)
  }

  return (data ?? []) as VariantGroupOptionOverride[]
}

export async function getProductVariantAssignmentData(
  requestedProductId?: string
): Promise<ProductVariantAssignmentData> {
  const [productData, businessId] = await Promise.all([
    getProductManagementData(requestedProductId),
    getBusinessId(),
  ])
  const { products, selectedProductId } = productData
  const [variantGroups, attachedGroups, overrides] = await Promise.all([
    getAssignableVariantGroups(businessId),
    getAttachedVariantGroups(businessId, selectedProductId),
    getVariantOptionOverrides(businessId, selectedProductId),
  ])
  const overridesByOptionId = new Map(
    overrides.map((override) => [override.variant_group_option_id, override])
  )
  const attachedGroupsWithOverrides = attachedGroups.map((assignment) => ({
    ...assignment,
    variantGroup: {
      ...assignment.variantGroup,
      options: assignment.variantGroup.options.map((option) => ({
        ...option,
        override: overridesByOptionId.get(option.id) ?? null,
      })),
    },
  }))
  const activeVariantGroupId =
    attachedGroupsWithOverrides.find((assignment) => assignment.is_enabled)
      ?.variant_group_id ?? null

  return {
    businessName: productData.businessName,
    menuGroups: productData.menuGroups,
    products,
    selectedProductId,
    selectedProductName:
      products.find((product) => product.id === selectedProductId)?.name ??
      null,
    attachedGroups: attachedGroupsWithOverrides,
    availableGroups: variantGroups.filter(
      (group) => group.id !== activeVariantGroupId
    ),
  }
}
