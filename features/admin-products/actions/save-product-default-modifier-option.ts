"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  resolveProductAdminActionContext,
  type ProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"
import {
  getProductDetailHref,
  getProductModifierAvailabilityHref,
  getProductModifierGroupsHref,
} from "@/features/admin-products/utils/product-admin-routes"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseBoolean(value: FormDataEntryValue | null) {
  if (value === "true") return true
  if (value === "false") return false

  throw new Error("Default state is invalid.")
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
  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("id")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("modifier_group_id", modifierGroupId)
    .eq("is_enabled", true)
    .single()

  if (assignmentError || !assignment) {
    throw new Error("Attach this modifier group before editing defaults.")
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

  const { data: group, error: groupError } = await supabaseAdmin
    .from("modifier_groups")
    .select("selection_type, max_allowed")
    .eq("business_id", businessId)
    .eq("id", modifierGroupId)
    .single()

  if (groupError || !group) {
    throw new Error("Selected modifier group is invalid.")
  }

  return {
    selectionType: group.selection_type as string,
    maxAllowed: group.max_allowed as number | null,
  }
}

function getActionBusinessSlug(context: ProductAdminActionContext) {
  return context.isScoped ? context.businessSlug : undefined
}

function revalidateDefaultModifierPaths({
  context,
  productId,
  modifierGroupId,
}: {
  context: ProductAdminActionContext
  productId: string
  modifierGroupId: string
}) {
  const businessSlug = getActionBusinessSlug(context)

  if (!context.isScoped) {
    revalidatePath(`/admin/modifiers/${modifierGroupId}`)
  }
  revalidatePath(getProductModifierGroupsHref(productId, businessSlug))
  revalidatePath(
    getProductModifierAvailabilityHref({
      modifierGroupId,
      productId,
      businessSlug,
    })
  )
  revalidatePath(getProductDetailHref(productId, businessSlug))
  revalidatePath("/menu")
}

export async function setProductDefaultModifierOption(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const productId = parseString(formData.get("productId"), "Product")
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const modifierOptionId = parseString(
    formData.get("modifierOptionId"),
    "Modifier option"
  )
  const isDefault = parseBoolean(formData.get("isDefault"))

  const groupRules = await assertProductModifierOption({
    businessId: context.businessId,
    productId,
    modifierGroupId,
    modifierOptionId,
  })

  if (!isDefault) {
    const { error } = await supabaseAdmin
      .from("product_default_modifier_options")
      .delete()
      .eq("business_id", context.businessId)
      .eq("product_id", productId)
      .eq("modifier_group_id", modifierGroupId)
      .eq("modifier_option_id", modifierOptionId)

    if (error) {
      throw new Error(`Could not remove default modifier option: ${error.message}`)
    }
  } else {
    if (groupRules.selectionType === "single" || groupRules.maxAllowed === 1) {
      const { error } = await supabaseAdmin
        .from("product_default_modifier_options")
        .delete()
        .eq("business_id", context.businessId)
        .eq("product_id", productId)
        .eq("modifier_group_id", modifierGroupId)
        .neq("modifier_option_id", modifierOptionId)

      if (error) {
        throw new Error(
          `Could not clear existing default modifier options: ${error.message}`
        )
      }
    }

    const { error } = await supabaseAdmin
      .from("product_default_modifier_options")
      .upsert(
        {
          business_id: context.businessId,
          product_id: productId,
          modifier_group_id: modifierGroupId,
          modifier_option_id: modifierOptionId,
          placement: "whole",
          multiplier: 1,
          quantity: 1,
          is_enabled: true,
          sort_order: 0,
        },
        {
          onConflict: "product_id,modifier_group_id,modifier_option_id",
        }
      )

    if (error) {
      throw new Error(`Could not save default modifier option: ${error.message}`)
    }
  }

  revalidateDefaultModifierPaths({
    context,
    productId,
    modifierGroupId,
  })
}
