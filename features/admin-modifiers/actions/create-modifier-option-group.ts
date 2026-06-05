"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getModifierAdminActionHref,
  resolveModifierAdminActionContext,
} from "@/features/admin-modifiers/utils/modifier-admin-action-context"

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

function parseOptionalSortOrder(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  const sortOrder = Number(value)

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be zero or greater.")
  }

  return sortOrder
}

async function getNextSortOrder(businessId: string, modifierGroupId: string) {
  const { data, error } = await supabaseAdmin
    .from("modifier_option_groups")
    .select("sort_order")
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .order("sort_order", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Could not load subgroup sort order: ${error.message}`)
  }

  return (data?.[0]?.sort_order ?? 0) + 1
}

export async function createModifierOptionGroup(formData: FormData) {
  const context = await resolveModifierAdminActionContext(formData)
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const name = parseString(formData.get("name"), "Subgroup name")
  const description = parseNullableString(formData.get("description"))
  const isEnabled = parseEnabled(formData.get("isEnabled"))
  const requestedSortOrder = parseOptionalSortOrder(formData.get("sortOrder"))

  const { data: modifierGroup, error: modifierGroupError } = await supabaseAdmin
    .from("modifier_groups")
    .select("id")
    .eq("id", modifierGroupId)
    .eq("business_id", context.businessId)
    .single()

  if (modifierGroupError || !modifierGroup) {
    throw new Error("Selected modifier group is invalid.")
  }

  const sortOrder =
    requestedSortOrder ??
    (await getNextSortOrder(context.businessId, modifierGroupId))

  const { error } = await supabaseAdmin.from("modifier_option_groups").insert({
    business_id: context.businessId,
    modifier_group_id: modifierGroupId,
    name,
    description,
    sort_order: sortOrder,
    is_enabled: isEnabled,
  })

  if (error) {
    throw new Error(`Could not create modifier subgroup: ${error.message}`)
  }

  revalidatePath(getModifierAdminActionHref(context))
  revalidatePath(getModifierAdminActionHref(context, "subgroups"))
  revalidatePath(getModifierAdminActionHref(context, "options"))
  revalidatePath(getModifierAdminActionHref(context, modifierGroupId))
}
