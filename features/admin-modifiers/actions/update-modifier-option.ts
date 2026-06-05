"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  moveModifierOption,
  type MoveModifierOptionStore,
} from "@/features/admin-modifiers/utils/move-modifier-option"
import { buildModifierOptionWritePayload } from "@/features/admin-modifiers/utils/modifier-option-write-payload"
import {
  getModifierAdminActionHref,
  resolveModifierAdminActionContext,
} from "@/features/admin-modifiers/utils/modifier-admin-action-context"

export type UpdateModifierOptionResult = {
  status: "updated" | "blocked" | "error"
  message: string
}

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseModifierOptionGroupId(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Modifier Option Group/List is required.")
  }

  return value.trim()
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

function parseSortOrder(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Sort order is required.")
  }

  const sortOrder = Number(value)

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be a whole number.")
  }

  return sortOrder
}

function createMoveStore({
  businessId,
  name,
  priceDelta,
  sortOrder,
}: {
  businessId: string
  name: string
  priceDelta: number
  sortOrder: number
}): MoveModifierOptionStore {
  return {
    async findOption({ optionId, modifierGroupId }) {
      const { data, error } = await supabaseAdmin
        .from("modifier_options")
        .select("id, modifier_group_id, modifier_option_group_id")
        .eq("id", optionId)
        .eq("business_id", businessId)
        .eq("modifier_group_id", modifierGroupId)
        .single()

      if (error || !data) return null

      return {
        id: data.id as string,
        modifier_group_id: data.modifier_group_id as string,
        modifier_option_group_id:
          (data.modifier_option_group_id as string | null) ?? null,
      }
    },
    async findDestinationOptionGroup({
      modifierGroupId,
      destinationOptionGroupId,
    }) {
      const { data, error } = await supabaseAdmin
        .from("modifier_option_groups")
        .select("id, modifier_group_id")
        .eq("id", destinationOptionGroupId)
        .eq("business_id", businessId)
        .eq("modifier_group_id", modifierGroupId)
        .single()

      if (error || !data) return null

      return {
        id: data.id as string,
        modifier_group_id: data.modifier_group_id as string,
      }
    },
    async updateOptionGroup({
      optionId,
      modifierGroupId,
      destinationOptionGroupId,
    }) {
      if (!destinationOptionGroupId) {
        throw new Error("Modifier Option Group/List is required.")
      }

      const { error } = await supabaseAdmin
        .from("modifier_options")
        .update(
          buildModifierOptionWritePayload({
            modifierOptionGroupId: destinationOptionGroupId,
            name,
            priceDelta,
            sortOrder,
          })
        )
        .eq("id", optionId)
        .eq("business_id", businessId)
        .eq("modifier_group_id", modifierGroupId)

      if (error) {
        throw new Error(`Could not update modifier option: ${error.message}`)
      }
    },
  }
}

export async function updateModifierOption(
  formData: FormData
): Promise<UpdateModifierOptionResult> {
  try {
    const context = await resolveModifierAdminActionContext(formData)
    const optionId = parseString(formData.get("optionId"), "Option")
    const modifierGroupId = parseString(
      formData.get("modifierGroupId"),
      "Modifier group"
    )
    const modifierOptionGroupId = parseModifierOptionGroupId(
      formData.get("modifierOptionGroupId")
    )
    const name = parseString(formData.get("name"), "Option name")
    const priceDelta = parsePrice(formData.get("priceDelta"))
    const sortOrder = parseSortOrder(formData.get("sortOrder"))

    const result = await moveModifierOption({
      payload: {
        optionId,
        modifierGroupId,
        destinationOptionGroupId: modifierOptionGroupId,
      },
      store: createMoveStore({
        businessId: context.businessId,
        name,
        priceDelta,
        sortOrder,
      }),
    })

    if (result.status === "blocked") {
      return result
    }

    revalidatePath(getModifierAdminActionHref(context))
    revalidatePath(getModifierAdminActionHref(context, "options"))
    revalidatePath(getModifierAdminActionHref(context, "subgroups"))
    revalidatePath(getModifierAdminActionHref(context, modifierGroupId))
    if (modifierOptionGroupId) {
      revalidatePath(
        getModifierAdminActionHref(
          context,
          `${modifierGroupId}/subgroups/${modifierOptionGroupId}`
        )
      )
    }

    return {
      status: "updated",
      message: "Modifier option updated.",
    }
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Modifier option could not be updated. Please try again.",
    }
  }
}
