"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductAdminActionHref,
  resolveProductAdminActionContext,
  type ProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"
import { getVariantGroupDetailHref } from "@/features/admin-products/utils/product-admin-routes"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseNullableString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function parsePrice(value: FormDataEntryValue | null) {
  const rawValue = parseString(value, "Base price")
  const price = Number(rawValue)

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Base price must be zero or greater.")
  }

  return price
}

function parseSortOrder(value: FormDataEntryValue | null) {
  const sortOrder = Number(value)

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be zero or greater.")
  }

  return sortOrder
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true"
}

async function assertVariantGroup(businessId: string, groupId: string) {
  const { data, error } = await supabaseAdmin
    .from("variant_groups")
    .select("id")
    .eq("id", groupId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected variant group is invalid.")
  }
}

async function getExistingOption(
  businessId: string,
  optionId: string | null
) {
  if (!optionId) return null

  const { data, error } = await supabaseAdmin
    .from("variant_group_options")
    .select("id, variant_group_id")
    .eq("id", optionId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected variant group option is invalid.")
  }

  return data as {
    id: string
    variant_group_id: string
  }
}

async function groupHasDefaultOption(
  businessId: string,
  groupId: string,
  exceptOptionId: string | null
) {
  let query = supabaseAdmin
    .from("variant_group_options")
    .select("id")
    .eq("business_id", businessId)
    .eq("variant_group_id", groupId)
    .eq("is_default", true)
    .limit(1)

  if (exceptOptionId) {
    query = query.neq("id", exceptOptionId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Could not validate default option: ${error.message}`)
  }

  return (data ?? []).length > 0
}

async function clearDefaultOptions(businessId: string, groupId: string) {
  const { error } = await supabaseAdmin
    .from("variant_group_options")
    .update({ is_default: false })
    .eq("business_id", businessId)
    .eq("variant_group_id", groupId)

  if (error) {
    throw new Error(`Could not update default option: ${error.message}`)
  }
}

function getVariantGroupDetailActionHref({
  context,
  groupId,
}: {
  context: ProductAdminActionContext
  groupId: string
}) {
  return getVariantGroupDetailHref({
    groupId,
    businessSlug: context.isScoped ? context.businessSlug : undefined,
  })
}

function revalidateVariantGroupOptionPaths({
  context,
  groupId,
}: {
  context: ProductAdminActionContext
  groupId: string
}) {
  revalidatePath(getProductAdminActionHref(context))
  revalidatePath(getProductAdminActionHref(context, "variant-groups"))
  revalidatePath(getVariantGroupDetailActionHref({ context, groupId }))
  revalidatePath("/menu")
}

export async function saveVariantGroupOption(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const groupId = parseString(formData.get("groupId"), "Variant group")
  const optionId = parseNullableString(formData.get("optionId"))
  const name = parseString(formData.get("name"), "Option name")
  const basePrice = parsePrice(formData.get("basePrice"))
  const sortOrder = parseSortOrder(formData.get("sortOrder"))
  const isEnabled = parseBoolean(formData.get("isEnabled"))
  let isDefault = parseBoolean(formData.get("isDefault"))

  await assertVariantGroup(context.businessId, groupId)
  const existingOption = await getExistingOption(context.businessId, optionId)

  if (existingOption && existingOption.variant_group_id !== groupId) {
    throw new Error("Variant option cannot be moved between groups yet.")
  }

  const hasAnotherDefault = await groupHasDefaultOption(
    context.businessId,
    groupId,
    optionId
  )

  if (!isDefault && !hasAnotherDefault) {
    isDefault = true
  }

  if (isDefault) {
    await clearDefaultOptions(context.businessId, groupId)
  }

  if (optionId) {
    const { error } = await supabaseAdmin
      .from("variant_group_options")
      .update({
        name,
        base_price: basePrice,
        is_default: isDefault,
        is_enabled: isEnabled,
        sort_order: sortOrder,
      })
      .eq("id", optionId)
      .eq("business_id", context.businessId)

    if (error) {
      throw new Error(`Could not update variant option: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin.from("variant_group_options").insert({
      business_id: context.businessId,
      variant_group_id: groupId,
      name,
      base_price: basePrice,
      is_default: isDefault,
      is_enabled: isEnabled,
      sort_order: sortOrder,
    })

    if (error) {
      throw new Error(`Could not create variant option: ${error.message}`)
    }
  }

  revalidateVariantGroupOptionPaths({ context, groupId })
}
