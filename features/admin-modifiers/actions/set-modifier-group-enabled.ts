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

export async function setModifierGroupEnabled(formData: FormData) {
  const context = await resolveModifierAdminActionContext(formData)
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const isEnabled = parseEnabled(formData.get("isEnabled"))

  const { data: modifierGroup, error: modifierGroupError } = await supabaseAdmin
    .from("modifier_groups")
    .select("id")
    .eq("id", modifierGroupId)
    .eq("business_id", context.businessId)
    .single()

  if (modifierGroupError || !modifierGroup) {
    throw new Error("Selected modifier group is invalid.")
  }

  const { error } = await supabaseAdmin
    .from("modifier_groups")
    .update({ is_enabled: isEnabled })
    .eq("id", modifierGroupId)
    .eq("business_id", context.businessId)

  if (error) {
    throw new Error(`Could not update modifier group: ${error.message}`)
  }

  revalidatePath(getModifierAdminActionHref(context))
  revalidatePath(getModifierAdminActionHref(context, "groups"))
  revalidatePath(getModifierAdminActionHref(context, modifierGroupId))
}
