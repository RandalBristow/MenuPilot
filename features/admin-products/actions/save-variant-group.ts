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

async function assertVariantGroup(businessId: string, groupId: string | null) {
  if (!groupId) return

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

export async function saveVariantGroup(formData: FormData) {
  const businessId = await getBusinessId()
  const groupId = parseNullableString(formData.get("groupId"))
  const name = parseString(formData.get("name"), "Variant group name")
  const description = parseNullableString(formData.get("description"))
  const sortOrder = parseSortOrder(formData.get("sortOrder"))
  const isEnabled = parseBoolean(formData.get("isEnabled"))

  await assertVariantGroup(businessId, groupId)

  if (groupId) {
    const { error } = await supabaseAdmin
      .from("variant_groups")
      .update({
        name,
        description,
        is_enabled: isEnabled,
        sort_order: sortOrder,
      })
      .eq("id", groupId)
      .eq("business_id", businessId)

    if (error) {
      throw new Error(`Could not update variant group: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin.from("variant_groups").insert({
      business_id: businessId,
      name,
      description,
      is_enabled: isEnabled,
      sort_order: sortOrder,
    })

    if (error) {
      throw new Error(`Could not create variant group: ${error.message}`)
    }
  }

  revalidatePath("/admin/products")
  revalidatePath("/admin/products/variant-groups")
  if (groupId) {
    revalidatePath(`/admin/products/variant-groups/${groupId}`)
  }
  revalidatePath("/menu")
}
