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

function parseSortOrder(value: FormDataEntryValue | null) {
  const sortOrder = Number(value)

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be zero or greater.")
  }

  return sortOrder
}

export async function updateModifierOptionGroup(formData: FormData) {
  const context = await resolveModifierAdminActionContext(formData)
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

  const { data: optionGroup, error: optionGroupError } = await supabaseAdmin
    .from("modifier_option_groups")
    .select("id")
    .eq("id", modifierOptionGroupId)
    .eq("business_id", context.businessId)
    .eq("modifier_group_id", modifierGroupId)
    .single()

  if (optionGroupError || !optionGroup) {
    throw new Error("Selected modifier option group is invalid.")
  }

  const { error } = await supabaseAdmin
    .from("modifier_option_groups")
    .update({
      name,
      description,
      sort_order: sortOrder,
      is_enabled: isEnabled,
    })
    .eq("id", modifierOptionGroupId)
    .eq("business_id", context.businessId)
    .eq("modifier_group_id", modifierGroupId)

  if (error) {
    throw new Error(`Could not update modifier subgroup: ${error.message}`)
  }

  revalidatePath(getModifierAdminActionHref(context))
  revalidatePath(getModifierAdminActionHref(context, "subgroups"))
  revalidatePath(getModifierAdminActionHref(context, "options"))
  revalidatePath(getModifierAdminActionHref(context, modifierGroupId))
}
