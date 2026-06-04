"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { buildModifierOptionWritePayload } from "@/features/admin-modifiers/utils/modifier-option-write-payload"

const BUSINESS_SLUG = "pronto-demo"

export type CreateModifierOptionResult = {
  status: "created" | "error"
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

async function getNextOptionGroupSortOrder({
  businessId,
  modifierGroupId,
  modifierOptionGroupId,
}: {
  businessId: string
  modifierGroupId: string
  modifierOptionGroupId: string
}) {
  const { data, error } = await supabaseAdmin
    .from("modifier_options")
    .select("sort_order")
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .eq("modifier_option_group_id", modifierOptionGroupId)
    .order("sort_order", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Could not load modifier option sort order: ${error.message}`)
  }

  return (data?.[0]?.sort_order ?? 0) + 1
}

function parseOptionalSortOrder(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  const sortOrder = Number(value)

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be a whole number.")
  }

  return sortOrder
}

export async function createModifierOption(
  formData: FormData
): Promise<CreateModifierOptionResult> {
  try {
    const businessId = await getBusinessId()
    const modifierGroupId = parseString(
      formData.get("modifierGroupId"),
      "Modifier group"
    )
    const modifierOptionGroupId = parseModifierOptionGroupId(
      formData.get("modifierOptionGroupId")
    )
    const name = parseString(formData.get("name"), "Option name")
    const priceDelta = parsePrice(formData.get("priceDelta"))
    const manualSortOrder = parseOptionalSortOrder(formData.get("sortOrder"))

    const { data: modifierGroup, error: modifierGroupError } =
      await supabaseAdmin
        .from("modifier_groups")
        .select("id")
        .eq("id", modifierGroupId)
        .eq("business_id", businessId)
        .single()

    if (modifierGroupError || !modifierGroup) {
      throw new Error("Selected modifier group is invalid.")
    }

    const { data: optionGroup, error: optionGroupError } = await supabaseAdmin
      .from("modifier_option_groups")
      .select("id")
      .eq("id", modifierOptionGroupId)
      .eq("business_id", businessId)
      .eq("modifier_group_id", modifierGroupId)
      .single()

    if (optionGroupError || !optionGroup) {
      throw new Error("Selected Modifier Option Group/List is invalid.")
    }

    const sortOrder =
      manualSortOrder ??
      (await getNextOptionGroupSortOrder({
        businessId,
        modifierGroupId,
        modifierOptionGroupId,
      }))

    const { error } = await supabaseAdmin.from("modifier_options").insert({
      business_id: businessId,
      modifier_group_id: modifierGroupId,
      ...buildModifierOptionWritePayload({
        modifierOptionGroupId,
        name,
        priceDelta,
        sortOrder,
      }),
      is_enabled: true,
    })

    if (error) {
      throw new Error(`Could not create modifier option: ${error.message}`)
    }

    revalidatePath("/admin/modifiers")
    revalidatePath("/admin/modifiers/options")
    revalidatePath(`/admin/modifiers/${modifierGroupId}`)

    return {
      status: "created",
      message: "Modifier option created.",
    }
  } catch (error) {
    console.error(error)

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Modifier option could not be created. Please try again.",
    }
  }
}
