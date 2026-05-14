"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getModifierOptionDeleteStrategy } from "@/features/admin-modifiers/utils/get-modifier-option-delete-strategy"

const BUSINESS_SLUG = "pronto-demo"

export type DeleteModifierOptionResult = {
  deleted: boolean
  disabled: boolean
  message: string
}

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
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

async function getModifierOption(
  businessId: string,
  optionId: string,
  modifierGroupId: string
) {
  const { data, error } = await supabaseAdmin
    .from("modifier_options")
    .select("id, modifier_group_id")
    .eq("id", optionId)
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .single()

  if (error || !data) {
    throw new Error("Selected modifier option is invalid.")
  }

  return data as { id: string; modifier_group_id: string }
}

async function hasProductUsage(businessId: string, modifierGroupId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("id")
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .limit(1)

  if (error) {
    throw new Error(`Could not check product usage: ${error.message}`)
  }

  return (data ?? []).length > 0
}

async function hasOrderUsage(businessId: string, optionId: string) {
  const { data, error } = await supabaseAdmin
    .from("order_item_modifiers")
    .select("id")
    .eq("business_id", businessId)
    .eq("modifier_option_id", optionId)
    .limit(1)

  if (error) {
    throw new Error(`Could not check order usage: ${error.message}`)
  }

  return (data ?? []).length > 0
}

export async function deleteModifierOption(
  formData: FormData
): Promise<DeleteModifierOptionResult> {
  const businessId = await getBusinessId()
  const optionId = parseString(formData.get("optionId"), "Option")
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const option = await getModifierOption(businessId, optionId, modifierGroupId)
  const [usedByProducts, usedByOrders] = await Promise.all([
    hasProductUsage(businessId, option.modifier_group_id),
    hasOrderUsage(businessId, option.id),
  ])

  if (
    getModifierOptionDeleteStrategy({
      usedByProducts,
      usedByOrders,
    }) === "disable"
  ) {
    const { error } = await supabaseAdmin
      .from("modifier_options")
      .update({ is_enabled: false })
      .eq("id", option.id)
      .eq("business_id", businessId)
      .eq("modifier_group_id", option.modifier_group_id)

    if (error) {
      throw new Error(`Could not disable modifier option: ${error.message}`)
    }

    revalidatePath("/admin/modifiers")
    revalidatePath("/admin/modifiers/options")
    revalidatePath(`/admin/modifiers/${option.modifier_group_id}`)

    return {
      deleted: false,
      disabled: true,
      message:
        "This option is in use, so it was disabled instead of permanently deleted.",
    }
  }

  const { error } = await supabaseAdmin
    .from("modifier_options")
    .delete()
    .eq("id", option.id)
    .eq("business_id", businessId)
    .eq("modifier_group_id", option.modifier_group_id)

  if (error) {
    throw new Error(`Could not delete modifier option: ${error.message}`)
  }

  revalidatePath("/admin/modifiers")
  revalidatePath("/admin/modifiers/options")
  revalidatePath(`/admin/modifiers/${option.modifier_group_id}`)

  return {
    deleted: true,
    disabled: false,
    message: "Modifier option deleted.",
  }
}
