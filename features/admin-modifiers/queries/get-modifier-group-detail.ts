import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  type ModifierAdminBusinessContextInput,
  resolveModifierAdminBusinessContext,
} from "@/features/admin-modifiers/utils/modifier-admin-business-context"

export type ProductModifierOptionOverride = {
  id: string | null
  modifier_option_id: string
  price_delta_override: number | null
  prep_time_delta_minutes_override: number | null
  is_enabled: boolean | null
  sort_order: number | null
}

export type ProductDefaultModifierOption = {
  id: string
  modifier_option_id: string
  placement: "left" | "whole" | "right"
  multiplier: number
  quantity: number
  is_enabled: boolean
  sort_order: number
}

export type ModifierGroupDetailOption = {
  id: string
  name: string
  description: string | null
  price_delta: number
  prep_time_delta_minutes: number
  is_enabled: boolean
  sort_order: number
  modifier_option_group_id: string | null
  override: ProductModifierOptionOverride | null
  defaultSelection: ProductDefaultModifierOption | null
}

export type ModifierGroupDetailSubgroup = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  sort_order: number
}

export type ModifierGroupDetail = {
  id: string
  modifier_category_id: string | null
  name: string
  description: string | null
  selection_type: string
  min_required: number
  max_allowed: number | null
  is_required: boolean
  supports_placement: boolean
  supports_multiplier: boolean
  min_multiplier: number
  max_multiplier: number
  multiplier_step: number
  is_enabled: boolean
  sort_order: number
  optionGroups: ModifierGroupDetailSubgroup[]
  options: ModifierGroupDetailOption[]
}

export type ModifierGroupProductContext = {
  id: string
  name: string
} | null

type ModifierGroupDetailContext =
  | {
      mode: "global"
      productContext: null
    }
  | {
      mode: "product"
      productContext: NonNullable<ModifierGroupProductContext>
    }
  | {
      mode: "preview"
      productContext: NonNullable<ModifierGroupProductContext>
    }

function toNumber(value: number | string) {
  return Number(value)
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

async function getDetailContext(
  businessId: string,
  groupId: string,
  productId?: string
): Promise<ModifierGroupDetailContext | null> {
  if (!productId) {
    return {
      mode: "global",
      productContext: null,
    }
  }

  const productContext = await getProductContext(businessId, productId)

  if (!productContext) return null

  const { data: assignment, error } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("id")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("modifier_group_id", groupId)
    .eq("is_enabled", true)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load modifier assignment: ${error.message}`)
  }

  return {
    mode: assignment ? "product" : "preview",
    productContext,
  }
}

async function getProductOptionOverrides(
  businessId: string,
  productId?: string
) {
  if (!productId) return []

  const { data, error } = await supabaseAdmin
    .from("product_modifier_option_overrides")
    .select(
      `
      id,
      modifier_option_id,
      price_delta_override,
      prep_time_delta_minutes_override,
      is_enabled,
      sort_order
    `
    )
    .eq("business_id", businessId)
    .eq("product_id", productId)

  if (error && isMissingOverrideTableError(error)) {
    return []
  }

  if (error) {
    throw new Error(`Could not load modifier option overrides: ${error.message}`)
  }

  return (data ?? []) as ProductModifierOptionOverride[]
}

async function getProductDefaultModifierOptions(
  businessId: string,
  productId?: string,
  modifierGroupId?: string
) {
  if (!productId || !modifierGroupId) return []

  const { data, error } = await supabaseAdmin
    .from("product_default_modifier_options")
    .select(
      `
      id,
      modifier_option_id,
      placement,
      multiplier,
      quantity,
      is_enabled,
      sort_order
    `
    )
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("modifier_group_id", modifierGroupId)

  if (error) {
    throw new Error(`Could not load product modifier defaults: ${error.message}`)
  }

  return (data ?? []).map((item) => ({
    ...item,
    multiplier: toNumber(item.multiplier as number | string),
    quantity: toNumber(item.quantity as number | string),
  })) as ProductDefaultModifierOption[]
}

function isMissingOverrideTableError(error: { code?: string; message: string }) {
  return (
    error.code === "PGRST205" ||
    error.message.includes("product_modifier_option_overrides") ||
    error.message.includes("schema cache")
  )
}

export async function getModifierGroupDetail(
  groupId: string,
  productId?: string,
  businessContext: ModifierAdminBusinessContextInput = {}
) {
  const business = await resolveModifierAdminBusinessContext(businessContext)
  const { data, error } = await supabaseAdmin
    .from("modifier_groups")
    .select(
      `
      id,
      modifier_category_id,
      name,
      description,
      selection_type,
      min_required,
      max_allowed,
      is_required,
      supports_placement,
      supports_multiplier,
      min_multiplier,
      max_multiplier,
      multiplier_step,
      is_enabled,
      sort_order,
      modifier_option_groups (
        id,
        name,
        description,
        is_enabled,
        sort_order
      ),
      modifier_options (
        id,
        name,
        description,
        price_delta,
        prep_time_delta_minutes,
        is_enabled,
        sort_order,
        modifier_option_group_id
      )
    `
    )
    .eq("business_id", business.id)
    .eq("id", groupId)
    .single()

  if (error || !data) {
    return null
  }

  const context = await getDetailContext(business.id, groupId, productId)

  if (!context) return null

  const overrides =
    context.mode === "product"
      ? await getProductOptionOverrides(business.id, productId)
      : []
  const defaultSelections =
    context.mode === "product"
      ? await getProductDefaultModifierOptions(business.id, productId, groupId)
      : []
  const overridesByOptionId = new Map(
    overrides.map((override) => [override.modifier_option_id, override])
  )
  const defaultsByOptionId = new Map(
    defaultSelections.map((defaultSelection) => [
      defaultSelection.modifier_option_id,
      defaultSelection,
    ])
  )
  const group = data as {
    id: string
    modifier_category_id: string | null
    name: string
    description: string | null
    selection_type: string
    min_required: number
    max_allowed: number | null
    is_required: boolean
    supports_placement: boolean
    supports_multiplier: boolean
    min_multiplier: number | string
    max_multiplier: number | string
    multiplier_step: number | string
    is_enabled: boolean
    sort_order: number
    modifier_option_groups: ModifierGroupDetailSubgroup[] | null
    modifier_options:
      | Array<{
          id: string
          name: string
          description: string | null
          price_delta: number | string
          prep_time_delta_minutes: number
          is_enabled: boolean
          sort_order: number
          modifier_option_group_id: string | null
        }>
      | null
  }

  return {
    businessName: business.name,
    mode: context.mode,
    productContext: context.productContext,
    group: {
      id: group.id,
      modifier_category_id: group.modifier_category_id,
      name: group.name,
      description: group.description,
      selection_type: group.selection_type,
      min_required: group.min_required,
      max_allowed: group.max_allowed,
      is_required: group.is_required,
      supports_placement: group.supports_placement,
      supports_multiplier: group.supports_multiplier,
      min_multiplier: toNumber(group.min_multiplier),
      max_multiplier: toNumber(group.max_multiplier),
      multiplier_step: toNumber(group.multiplier_step),
      is_enabled: group.is_enabled,
      sort_order: group.sort_order,
      optionGroups: sortBySortOrder(group.modifier_option_groups ?? []),
      options: sortBySortOrder(
        (group.modifier_options ?? []).map((option) => ({
          ...option,
          price_delta: toNumber(option.price_delta),
          override: overridesByOptionId.get(option.id) ?? null,
          defaultSelection: defaultsByOptionId.get(option.id) ?? null,
        }))
      ),
    } satisfies ModifierGroupDetail,
  }
}
