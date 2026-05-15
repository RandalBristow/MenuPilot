"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"

const BUSINESS_SLUG = "pronto-demo"

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

export async function saveVariantGroupOption(formData: FormData) {
  const businessId = await getBusinessId()
  const groupId = parseString(formData.get("groupId"), "Variant group")
  const optionId = parseNullableString(formData.get("optionId"))
  const name = parseString(formData.get("name"), "Option name")
  const basePrice = parsePrice(formData.get("basePrice"))
  const sortOrder = parseSortOrder(formData.get("sortOrder"))
  const isEnabled = parseBoolean(formData.get("isEnabled"))
  let isDefault = parseBoolean(formData.get("isDefault"))

  await assertVariantGroup(businessId, groupId)
  const existingOption = await getExistingOption(businessId, optionId)

  if (existingOption && existingOption.variant_group_id !== groupId) {
    throw new Error("Variant option cannot be moved between groups yet.")
  }

  const hasAnotherDefault = await groupHasDefaultOption(
    businessId,
    groupId,
    optionId
  )

  if (!isDefault && !hasAnotherDefault) {
    isDefault = true
  }

  if (isDefault) {
    await clearDefaultOptions(businessId, groupId)
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
      .eq("business_id", businessId)

    if (error) {
      throw new Error(`Could not update variant option: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin.from("variant_group_options").insert({
      business_id: businessId,
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

  revalidatePath("/admin/products")
  revalidatePath("/admin/products/variant-groups")
  revalidatePath(`/admin/products/variant-groups/${groupId}`)
  revalidatePath("/menu")
}
