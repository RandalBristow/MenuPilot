"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getSpecialAdminBaseHref } from "@/features/specials/utils/special-admin-routes"
import { resolveSpecialAdminActionContext } from "@/features/specials/utils/special-admin-action-context"

function parseRequiredString(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`)
  }

  return value.trim()
}

export async function setSpecialEnabled(formData: FormData) {
  const context = await resolveSpecialAdminActionContext(formData)
  const specialId = parseRequiredString(formData.get("specialId"), "Special id")
  const isEnabled = formData.get("isEnabled") === "true"

  const { error } = await supabaseAdmin
    .from("specials")
    .update({ is_enabled: isEnabled })
    .eq("business_id", context.businessId)
    .eq("id", specialId)

  if (error) {
    throw new Error(`Could not update special status: ${error.message}`)
  }

  revalidatePath(getSpecialAdminBaseHref(context.businessSlug))
  revalidatePath(
    `/businesses/${encodeURIComponent(context.businessSlug)}/admin`
  )
}
