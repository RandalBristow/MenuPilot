"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getModifierAdminActionHref,
  resolveModifierAdminActionContext,
} from "@/features/admin-modifiers/utils/modifier-admin-action-context"
import {
  parseOperational86Flag,
  parseOperationalExpiresAt,
  parseOperationalReason,
} from "@/features/availability/utils/operational-availability-form"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

async function assertModifierOption({
  businessId,
  modifierGroupId,
  optionId,
}: {
  businessId: string
  modifierGroupId: string
  optionId: string
}) {
  const { data, error } = await supabaseAdmin
    .from("modifier_options")
    .select("id")
    .eq("id", optionId)
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .single()

  if (error || !data) {
    throw new Error("Selected modifier option is invalid.")
  }
}

export async function setModifierOptionOperationalAvailability(
  formData: FormData
) {
  const context = await resolveModifierAdminActionContext(formData)
  const optionId = parseString(formData.get("optionId"), "Option")
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const is86d = parseOperational86Flag(formData.get("is86d"))
  const reason = parseOperationalReason(formData.get("reason"))
  const expiresAt = parseOperationalExpiresAt(formData.get("expiresAt"))

  await assertModifierOption({
    businessId: context.businessId,
    modifierGroupId,
    optionId,
  })

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("modifier_option_operational_availability")
    .select("id")
    .eq("business_id", context.businessId)
    .eq("modifier_option_id", optionId)
    .is("location_id", null)
    .maybeSingle()

  if (existingError) {
    throw new Error(
      `Could not load modifier option temporary availability: ${existingError.message}`
    )
  }

  const payload = {
    business_id: context.businessId,
    location_id: null,
    modifier_option_id: optionId,
    is_86d: is86d,
    reason: is86d ? reason : null,
    expires_at: is86d ? expiresAt : null,
  }

  const result = existing
    ? await supabaseAdmin
        .from("modifier_option_operational_availability")
        .update(payload)
        .eq("id", existing.id)
        .eq("business_id", context.businessId)
    : await supabaseAdmin
        .from("modifier_option_operational_availability")
        .insert(payload)

  if (result.error) {
    throw new Error(
      `Could not update modifier option temporary availability: ${result.error.message}`
    )
  }

  revalidatePath(getModifierAdminActionHref(context))
  revalidatePath(getModifierAdminActionHref(context, "options"))
  revalidatePath(getModifierAdminActionHref(context, modifierGroupId))
  revalidatePath("/menu")
  revalidatePath(`/businesses/${context.businessSlug}/menu`)
  revalidatePath(`/businesses/${context.businessSlug}/specials`)
}
