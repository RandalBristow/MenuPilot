"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getModifierAdminActionHref,
  getModifierAdminActionBusinessSlug,
  resolveModifierAdminActionContext,
} from "@/features/admin-modifiers/utils/modifier-admin-action-context"
import {
  getProductDetailHref,
  getProductModifierGroupsHref,
} from "@/features/admin-products/utils/product-admin-routes"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseNullableNumber(
  value: FormDataEntryValue | null,
  fieldName: string
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} must be zero or greater.`)
  }

  return number
}

function parseNullableInteger(
  value: FormDataEntryValue | null,
  fieldName: string
) {
  const number = parseNullableNumber(value, fieldName)

  if (number === null) return null

  if (!Number.isInteger(number)) {
    throw new Error(`${fieldName} must be a whole number.`)
  }

  return number
}

function parseNullableBoolean(value: FormDataEntryValue | null) {
  if (value === "true") return true
  if (value === "false") return false

  return null
}

function isMissingOverrideTableError(error: { code?: string; message: string }) {
  return (
    error.code === "PGRST205" ||
    error.message.includes("product_modifier_option_overrides") ||
    error.message.includes("schema cache")
  )
}

async function assertProductModifierOption({
  businessId,
  productId,
  modifierGroupId,
  modifierOptionId,
}: {
  businessId: string
  productId: string
  modifierGroupId: string
  modifierOptionId: string
}) {
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("business_id", businessId)
    .eq("id", productId)
    .single()

  if (productError || !product) {
    throw new Error("Selected product is invalid.")
  }

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("id")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("modifier_group_id", modifierGroupId)
    .eq("is_enabled", true)
    .single()

  if (assignmentError || !assignment) {
    throw new Error("Attach this modifier group before editing product overrides.")
  }

  const { data: option, error: optionError } = await supabaseAdmin
    .from("modifier_options")
    .select("id")
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)
    .eq("id", modifierOptionId)
    .single()

  if (optionError || !option) {
    throw new Error("Selected modifier option is invalid.")
  }
}

export async function saveProductModifierOptionOverride(formData: FormData) {
  const context = await resolveModifierAdminActionContext(formData)
  const productId = parseString(formData.get("productId"), "Product")
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const modifierOptionId = parseString(
    formData.get("modifierOptionId"),
    "Modifier option"
  )
  const priceDeltaOverride = parseNullableNumber(
    formData.get("priceDeltaOverride"),
    "Price override"
  )
  const prepTimeDeltaMinutesOverride = parseNullableInteger(
    formData.get("prepTimeDeltaMinutesOverride"),
    "Prep time override"
  )
  const isEnabled = parseNullableBoolean(formData.get("isEnabled"))
  const sortOrder = parseNullableInteger(
    formData.get("sortOrder"),
    "Sort order override"
  )

  await assertProductModifierOption({
    businessId: context.businessId,
    productId,
    modifierGroupId,
    modifierOptionId,
  })

  const { error } = await supabaseAdmin
    .from("product_modifier_option_overrides")
    .upsert(
      {
        business_id: context.businessId,
        product_id: productId,
        modifier_option_id: modifierOptionId,
        price_delta_override: priceDeltaOverride,
        prep_time_delta_minutes_override: prepTimeDeltaMinutesOverride,
        is_enabled: isEnabled,
        sort_order: sortOrder,
      },
      {
        onConflict: "product_id,modifier_option_id",
      }
    )

  if (error) {
    if (isMissingOverrideTableError(error)) {
      throw new Error(
        "Product modifier option overrides are not available because database migration 011_product_modifier_option_overrides.sql has not been applied."
      )
    }

    throw new Error(`Could not save modifier option override: ${error.message}`)
  }

  const businessSlug = getModifierAdminActionBusinessSlug(context)

  revalidatePath(getModifierAdminActionHref(context))
  revalidatePath(getModifierAdminActionHref(context, modifierGroupId))
  revalidatePath(getProductModifierGroupsHref(productId, businessSlug))
  revalidatePath(getProductDetailHref(productId, businessSlug))
  revalidatePath("/menu")
}
