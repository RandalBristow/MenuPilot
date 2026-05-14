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

function parseEnabled(value: FormDataEntryValue | null) {
  if (value === "true") return true
  if (value === "false") return false

  throw new Error("Enabled value is invalid.")
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

export async function setModifierGroupEnabled(formData: FormData) {
  const businessId = await getBusinessId()
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const isEnabled = parseEnabled(formData.get("isEnabled"))

  const { error } = await supabaseAdmin
    .from("modifier_groups")
    .update({ is_enabled: isEnabled })
    .eq("id", modifierGroupId)
    .eq("business_id", businessId)

  if (error) {
    throw new Error(`Could not update modifier group: ${error.message}`)
  }

  revalidatePath("/admin/modifiers")
  revalidatePath("/admin/modifiers/groups")
  revalidatePath(`/admin/modifiers/${modifierGroupId}`)
}
