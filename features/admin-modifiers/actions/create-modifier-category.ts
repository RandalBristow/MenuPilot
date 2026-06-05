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

async function getNextSortOrder(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("modifier_categories")
    .select("sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Could not load category sort order: ${error.message}`)
  }

  return (data?.[0]?.sort_order ?? 0) + 1
}

export async function createModifierCategory(formData: FormData) {
  const context = await resolveModifierAdminActionContext(formData)
  const name = parseString(formData.get("name"), "Category name")
  const description = parseNullableString(formData.get("description"))
  const sortOrder = await getNextSortOrder(context.businessId)

  const { error } = await supabaseAdmin
    .from("modifier_categories")
    .insert({
      business_id: context.businessId,
      name,
      description,
      sort_order: sortOrder,
      is_enabled: true,
    })

  if (error) {
    throw new Error(`Could not create modifier category: ${error.message}`)
  }

  revalidatePath(getModifierAdminActionHref(context))
  revalidatePath(getModifierAdminActionHref(context, "categories"))
  revalidatePath(getModifierAdminActionHref(context, "groups"))
  revalidatePath(getModifierAdminActionHref(context, "subgroups"))
  revalidatePath(getModifierAdminActionHref(context, "options"))
}
