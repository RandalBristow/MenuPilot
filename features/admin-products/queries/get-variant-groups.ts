import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  type ProductAdminBusinessContextInput,
  resolveProductAdminBusinessContext,
} from "@/features/admin-products/utils/product-admin-business-context"

export type VariantGroupListItem = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  sort_order: number
  optionCount: number
}

export type VariantGroupOption = {
  id: string
  name: string
  base_price: number
  prep_time_minutes: number | null
  is_default: boolean
  is_enabled: boolean
  sort_order: number
  override: ProductVariantOptionOverride | null
}

export type ProductVariantOptionOverride = {
  id: string | null
  variant_group_option_id: string
  price_override: number | null
  prep_time_minutes_override: number | null
  is_enabled: boolean | null
  is_default: boolean | null
  sort_order: number | null
}

export type VariantGroupDetail = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  sort_order: number
  options: VariantGroupOption[]
}

export type VariantGroupProductContext = {
  id: string
  name: string
} | null

type VariantGroupDetailContext =
  | {
      mode: "global"
      productContext: null
    }
  | {
      mode: "product"
      productContext: NonNullable<VariantGroupProductContext>
    }
  | {
      mode: "preview"
      productContext: NonNullable<VariantGroupProductContext>
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

export async function getVariantGroups(
  businessContext: ProductAdminBusinessContextInput = {}
) {
  const business = await resolveProductAdminBusinessContext(businessContext)
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
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Could not load variant groups: ${error.message}`)
  }

  const groups = ((data ?? []) as Array<{
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

  return {
    businessName: business.name,
    groups: sortBySortOrder(groups),
  }
}

async function getProductContext(businessId: string, productId?: string) {
  if (!productId) return null

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name")
    .eq("business_id", businessId)
    .eq("id", productId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load selected product: ${error.message}`)
  }

  if (!data) return null

  return {
    id: data.id as string,
    name: data.name as string,
  }
}

async function getVariantGroupDetailContext(
  businessId: string,
  groupId: string,
  productId?: string
): Promise<VariantGroupDetailContext | null> {
  if (!productId) {
    return {
      mode: "global",
      productContext: null,
    }
  }

  const productContext = await getProductContext(businessId, productId)

  if (!productContext) return null

  const { data: selectedAssignment, error } = await supabaseAdmin
    .from("product_variant_groups")
    .select("id")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("variant_group_id", groupId)
    .eq("is_enabled", true)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load variant assignment: ${error.message}`)
  }

  return {
    mode: selectedAssignment ? "product" : "preview",
    productContext,
  }
}

async function getProductOptionOverrides(
  businessId: string,
  productId?: string
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
    throw new Error(`Could not load option overrides: ${error.message}`)
  }

  return (data ?? []) as ProductVariantOptionOverride[]
}

export async function getVariantGroupDetail(
  groupId: string,
  productId?: string,
  businessContext: ProductAdminBusinessContextInput = {}
) {
  const business = await resolveProductAdminBusinessContext(businessContext)

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
        id,
          name,
          base_price,
          prep_time_minutes,
          is_default,
          is_enabled,
          sort_order
      )
    `
    )
    .eq("business_id", business.id)
    .eq("id", groupId)
    .single()

  if (error || !data) {
    return null
  }

  const group = data as {
    id: string
    name: string
    description: string | null
    is_enabled: boolean
    sort_order: number
    variant_group_options:
      | Array<{
          id: string
          name: string
          base_price: number
          prep_time_minutes: number | null
          is_default: boolean
          is_enabled: boolean
          sort_order: number
        }>
      | null
  }
  const context = await getVariantGroupDetailContext(
    business.id,
    groupId,
    productId
  )

  if (!context) return null
  const overrides =
    context.mode === "product"
      ? await getProductOptionOverrides(business.id, productId)
      : []
  const overridesByOptionId = new Map(
    overrides.map((override) => [override.variant_group_option_id, override])
  )

  return {
    businessName: business.name,
    mode: context.mode,
    productContext: context.productContext,
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      is_enabled: group.is_enabled,
      sort_order: group.sort_order,
      options: sortBySortOrder(
        (group.variant_group_options ?? []).map((option) => ({
          ...option,
          base_price: Number(option.base_price),
          override: overridesByOptionId.get(option.id) ?? null,
        }))
      ),
    },
  }
}
