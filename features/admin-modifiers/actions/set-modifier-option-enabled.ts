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

function parseEnabled(value: FormDataEntryValue | null) {
  if (value === "true") return true
  if (value === "false") return false

  throw new Error("Enabled value is invalid.")
}

export async function setModifierOptionEnabled(formData: FormData) {
  const context = await resolveModifierAdminActionContext(formData)
  const optionId = parseString(formData.get("optionId"), "Option")
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const isEnabled = parseEnabled(formData.get("isEnabled"))

  const { data: option, error: optionError } = await supabaseAdmin
    .from("modifier_options")
    .select("id")
    .eq("id", optionId)
    .eq("business_id", context.businessId)
    .eq("modifier_group_id", modifierGroupId)
    .single()

  if (optionError || !option) {
    throw new Error("Selected modifier option is invalid.")
  }

  const { error } = await supabaseAdmin
    .from("modifier_options")
    .update({ is_enabled: isEnabled })
    .eq("id", optionId)
    .eq("business_id", context.businessId)
    .eq("modifier_group_id", modifierGroupId)

  if (error) {
    throw new Error(`Could not update modifier option: ${error.message}`)
  }

  revalidatePath(getModifierAdminActionHref(context))
  revalidatePath(getModifierAdminActionHref(context, "options"))
  revalidatePath(getModifierAdminActionHref(context, modifierGroupId))
}
