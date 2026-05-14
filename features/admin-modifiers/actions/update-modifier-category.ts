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

export async function updateModifierCategory(formData: FormData) {
  const businessId = await getBusinessId()
  const categoryId = parseString(formData.get("categoryId"), "Category")
  const name = parseString(formData.get("name"), "Category name")
  const description = parseNullableString(formData.get("description"))

  const { error } = await supabaseAdmin
    .from("modifier_group_categories")
    .update({ name, description })
    .eq("id", categoryId)
    .eq("business_id", businessId)

  if (error) {
    throw new Error(`Could not update modifier category: ${error.message}`)
  }

  revalidatePath("/admin/modifiers")
  revalidatePath("/admin/modifiers/categories")
  revalidatePath("/admin/modifiers/groups")
  revalidatePath("/admin/modifiers/subgroups")
  revalidatePath("/admin/modifiers/options")
}
