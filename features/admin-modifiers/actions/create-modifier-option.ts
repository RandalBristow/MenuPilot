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
  if (typeof value !== "string" || value === "none" || value.length === 0) {
    return null
  }

  return value
}

function parsePrice(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return 0
  }

  const price = Number(value)

  if (!Number.isFinite(price)) {
    throw new Error("Price must be a valid number.")
  }

  return price
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

async function getNextSortOrder(businessId: string, modifierGroupId: string) {
  const { data, error } = await supabaseAdmin
    .from("modifier_options")
    .select("sort_order")
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .order("sort_order", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Could not load modifier option sort order: ${error.message}`)
  }

  return (data?.[0]?.sort_order ?? 0) + 1
}

export async function createModifierOption(formData: FormData) {
  const businessId = await getBusinessId()
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const modifierOptionGroupId = parseNullableString(
    formData.get("modifierOptionGroupId")
  )
  const name = parseString(formData.get("name"), "Option name")
  const priceDelta = parsePrice(formData.get("priceDelta"))

  const { data: modifierGroup, error: modifierGroupError } = await supabaseAdmin
    .from("modifier_groups")
    .select("id")
    .eq("id", modifierGroupId)
    .eq("business_id", businessId)
    .single()

  if (modifierGroupError || !modifierGroup) {
    throw new Error("Selected modifier group is invalid.")
  }

  if (modifierOptionGroupId) {
    const { data: optionGroup, error: optionGroupError } = await supabaseAdmin
      .from("modifier_option_groups")
      .select("id")
      .eq("id", modifierOptionGroupId)
      .eq("business_id", businessId)
      .eq("modifier_group_id", modifierGroupId)
      .single()

    if (optionGroupError || !optionGroup) {
      throw new Error("Selected modifier option subgroup is invalid.")
    }
  }

  const sortOrder = await getNextSortOrder(businessId, modifierGroupId)

  const { error } = await supabaseAdmin.from("modifier_options").insert({
    business_id: businessId,
    modifier_group_id: modifierGroupId,
    modifier_option_group_id: modifierOptionGroupId,
    name,
    price_delta: priceDelta,
    sort_order: sortOrder,
    is_enabled: true,
  })

  if (error) {
    throw new Error(`Could not create modifier option: ${error.message}`)
  }

  revalidatePath("/admin/modifiers")
}
