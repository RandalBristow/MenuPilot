"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  safeDeleteModifierOption,
  type ModifierOptionReferenceCheck,
} from "@/features/admin-modifiers/utils/safe-delete-modifier-option"
import {
  getModifierAdminActionHref,
  resolveModifierAdminActionContext,
} from "@/features/admin-modifiers/utils/modifier-admin-action-context"

export type DeleteModifierOptionResult = {
  status: "deleted" | "blocked" | "error"
  message: string
}

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

async function getModifierOption(
  businessId: string,
  optionId: string,
  modifierGroupId: string
) {
  const { data, error } = await supabaseAdmin
    .from("modifier_options")
    .select("id, modifier_group_id, modifier_option_group_id")
    .eq("id", optionId)
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .single()

  if (error || !data) {
    throw new Error("Selected modifier option is invalid.")
  }

  return data as {
    id: string
    modifier_group_id: string
    modifier_option_group_id: string | null
  }
}

async function hasModifierOptionReference({
  businessId,
  optionId,
  check,
}: {
  businessId: string
  optionId: string
  check: ModifierOptionReferenceCheck
}) {
  const { data, error } = await supabaseAdmin
    .from(check.table)
    .select("id")
    .eq("business_id", businessId)
    .eq(check.column, optionId)
    .limit(1)

  if (error) {
    throw new Error(`Could not check modifier option usage: ${error.message}`)
  }

  return (data ?? []).length > 0
}

export async function deleteModifierOption(
  formData: FormData
): Promise<DeleteModifierOptionResult> {
  try {
    const context = await resolveModifierAdminActionContext(formData)
    const optionId = parseString(formData.get("optionId"), "Option")
    const modifierGroupId = parseString(
      formData.get("modifierGroupId"),
      "Modifier group"
    )
    const option = await getModifierOption(
      context.businessId,
      optionId,
      modifierGroupId
    )
    const result = await safeDeleteModifierOption({
      hasReference: (check) =>
        hasModifierOptionReference({
          businessId: context.businessId,
          optionId: option.id,
          check,
        }),
      deleteOption: async () => {
        const { error } = await supabaseAdmin
          .from("modifier_options")
          .delete()
          .eq("id", option.id)
          .eq("business_id", context.businessId)
          .eq("modifier_group_id", option.modifier_group_id)

        if (error) {
          throw new Error(`Could not delete modifier option: ${error.message}`)
        }
      },
    })

    if (result.status === "deleted") {
      revalidatePath(getModifierAdminActionHref(context))
      revalidatePath(getModifierAdminActionHref(context, "options"))
      revalidatePath(getModifierAdminActionHref(context, "subgroups"))
      revalidatePath(
        getModifierAdminActionHref(context, option.modifier_group_id)
      )
      if (option.modifier_option_group_id) {
        revalidatePath(
          getModifierAdminActionHref(
            context,
            `${option.modifier_group_id}/subgroups/${option.modifier_option_group_id}`
          )
        )
      }
    }

    return {
      status: result.status,
      message: result.message,
    }
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Modifier option could not be deleted. Please try again.",
    }
  }
}
