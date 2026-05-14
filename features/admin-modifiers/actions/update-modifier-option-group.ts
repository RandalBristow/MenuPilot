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

function parseEnabled(value: FormDataEntryValue | null) {
  return value !== "false"
}

function parseSortOrder(value: FormDataEntryValue | null) {
  const sortOrder = Number(value)

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be zero or greater.")
  }

  return sortOrder
}

async function getBusinessId() {
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (error || !business) {
    throw new Error("Could not load modifier business.")
  }

  return business.id as string
}

export async function updateModifierOptionGroup(formData: FormData) {
  const businessId = await getBusinessId()
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const modifierOptionGroupId = parseString(
    formData.get("modifierOptionGroupId"),
    "Modifier option subgroup"
  )
  const name = parseString(formData.get("name"), "Subgroup name")
  const description = parseNullableString(formData.get("description"))
  const sortOrder = parseSortOrder(formData.get("sortOrder"))
  const isEnabled = parseEnabled(formData.get("isEnabled"))

  const { error } = await supabaseAdmin
    .from("modifier_option_groups")
    .update({
      name,
      description,
      sort_order: sortOrder,
      is_enabled: isEnabled,
    })
    .eq("id", modifierOptionGroupId)
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)

  if (error) {
    throw new Error(`Could not update modifier subgroup: ${error.message}`)
  }

  revalidatePath("/admin/modifiers")
  revalidatePath("/admin/modifiers/subgroups")
  revalidatePath("/admin/modifiers/options")
  revalidatePath(`/admin/modifiers/${modifierGroupId}`)
}
