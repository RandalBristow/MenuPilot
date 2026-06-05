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

export async function updateModifierCategory(formData: FormData) {
  const context = await resolveModifierAdminActionContext(formData)
  const categoryId = parseString(formData.get("categoryId"), "Category")
  const name = parseString(formData.get("name"), "Category name")
  const description = parseNullableString(formData.get("description"))

  const { data: category, error: categoryError } = await supabaseAdmin
    .from("modifier_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("business_id", context.businessId)
    .single()

  if (categoryError || !category) {
    throw new Error("Selected modifier category is invalid.")
  }

  const { error } = await supabaseAdmin
    .from("modifier_categories")
    .update({ name, description })
    .eq("id", categoryId)
    .eq("business_id", context.businessId)

  if (error) {
    throw new Error(`Could not update modifier category: ${error.message}`)
  }

  revalidatePath(getModifierAdminActionHref(context))
  revalidatePath(getModifierAdminActionHref(context, "categories"))
  revalidatePath(getModifierAdminActionHref(context, "groups"))
  revalidatePath(getModifierAdminActionHref(context, "subgroups"))
  revalidatePath(getModifierAdminActionHref(context, "options"))
}
