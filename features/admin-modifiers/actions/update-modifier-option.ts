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

export async function updateModifierOption(formData: FormData) {
  const businessId = await getBusinessId()
  const optionId = parseString(formData.get("optionId"), "Option")
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const modifierOptionGroupId = parseNullableString(
    formData.get("modifierOptionGroupId")
  )
  const name = parseString(formData.get("name"), "Option name")
  const priceDelta = parsePrice(formData.get("priceDelta"))

  const { data: option, error: optionError } = await supabaseAdmin
    .from("modifier_options")
    .select("id")
    .eq("id", optionId)
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .single()

  if (optionError || !option) {
    throw new Error("Selected modifier option is invalid.")
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

  const { error } = await supabaseAdmin
    .from("modifier_options")
    .update({
      modifier_option_group_id: modifierOptionGroupId,
      name,
      price_delta: priceDelta,
    })
    .eq("id", optionId)
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)

  if (error) {
    throw new Error(`Could not update modifier option: ${error.message}`)
  }

  revalidatePath("/admin/modifiers")
}
