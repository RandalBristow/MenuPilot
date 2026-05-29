"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  safeDeleteModifierOptionGroup,
  type ModifierOptionGroupDeleteResult,
} from "@/features/admin-modifiers/utils/safe-delete-modifier-option-group"

const BUSINESS_SLUG = "pronto-demo"

export type DeleteModifierOptionGroupResult = ModifierOptionGroupDeleteResult

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

async function getModifierOptionGroup({
  businessId,
  modifierGroupId,
  modifierOptionGroupId,
}: {
  businessId: string
  modifierGroupId: string
  modifierOptionGroupId: string
}) {
  const { data, error } = await supabaseAdmin
    .from("modifier_option_groups")
    .select("id, modifier_group_id")
    .eq("id", modifierOptionGroupId)
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .single()

  if (error || !data) {
    throw new Error("Selected modifier option list is invalid.")
  }

  return data as {
    id: string
    modifier_group_id: string
  }
}

async function getModifierOptionCount({
  businessId,
  modifierGroupId,
  modifierOptionGroupId,
}: {
  businessId: string
  modifierGroupId: string
  modifierOptionGroupId: string
}) {
  const { count, error } = await supabaseAdmin
    .from("modifier_options")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .eq("modifier_option_group_id", modifierOptionGroupId)

  if (error) {
    throw new Error(`Could not check modifier option list usage: ${error.message}`)
  }

  return count ?? 0
}

async function deleteModifierOptions({
  businessId,
  modifierGroupId,
  modifierOptionGroupId,
}: {
  businessId: string
  modifierGroupId: string
  modifierOptionGroupId: string
}) {
  const { error } = await supabaseAdmin
    .from("modifier_options")
    .delete()
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .eq("modifier_option_group_id", modifierOptionGroupId)

  if (error) {
    throw new Error(`Could not delete modifier options: ${error.message}`)
  }
}

export async function deleteModifierOptionGroup(
  formData: FormData
): Promise<DeleteModifierOptionGroupResult> {
  try {
    const businessId = await getBusinessId()
    const modifierGroupId = parseString(
      formData.get("modifierGroupId"),
      "Modifier group"
    )
    const modifierOptionGroupId = parseString(
      formData.get("modifierOptionGroupId"),
      "Modifier option list"
    )
    const optionGroup = await getModifierOptionGroup({
      businessId,
      modifierGroupId,
      modifierOptionGroupId,
    })

    const result = await safeDeleteModifierOptionGroup({
      getOptionCount: () =>
        getModifierOptionCount({
          businessId,
          modifierGroupId: optionGroup.modifier_group_id,
          modifierOptionGroupId: optionGroup.id,
        }),
      deleteOptions: () =>
        deleteModifierOptions({
          businessId,
          modifierGroupId: optionGroup.modifier_group_id,
          modifierOptionGroupId: optionGroup.id,
        }),
      deleteOptionGroup: async () => {
        const { error } = await supabaseAdmin
          .from("modifier_option_groups")
          .delete()
          .eq("id", optionGroup.id)
          .eq("business_id", businessId)
          .eq("modifier_group_id", optionGroup.modifier_group_id)

        if (error) {
          throw new Error(`Could not delete modifier option list: ${error.message}`)
        }
      },
    })

    if (result.status === "deleted") {
      revalidatePath("/admin/modifiers")
      revalidatePath("/admin/modifiers/subgroups")
      revalidatePath("/admin/modifiers/options")
      revalidatePath(`/admin/modifiers/${optionGroup.modifier_group_id}`)
    }

    return result
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Modifier option list could not be deleted. Please try again.",
    }
  }
}
