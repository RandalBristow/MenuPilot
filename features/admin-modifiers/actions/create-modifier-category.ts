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

async function getNextSortOrder(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("modifier_group_categories")
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
  const businessId = await getBusinessId()
  const name = parseString(formData.get("name"), "Category name")
  const description = parseNullableString(formData.get("description"))
  const sortOrder = await getNextSortOrder(businessId)

  const { error } = await supabaseAdmin
    .from("modifier_group_categories")
    .insert({
      business_id: businessId,
      name,
      description,
      sort_order: sortOrder,
      is_enabled: true,
    })

  if (error) {
    throw new Error(`Could not create modifier category: ${error.message}`)
  }

  revalidatePath("/admin/modifiers")
  revalidatePath("/admin/modifiers/categories")
  revalidatePath("/admin/modifiers/groups")
  revalidatePath("/admin/modifiers/subgroups")
  revalidatePath("/admin/modifiers/options")
}
