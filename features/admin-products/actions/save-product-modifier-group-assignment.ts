"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductAdminActionHref,
  resolveProductAdminActionContext,
  type ProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"
import {
  getProductDetailHref,
  getProductModifierGroupsHref,
} from "@/features/admin-products/utils/product-admin-routes"

function isMissingModifierOverrideTableError(error: {
  code?: string
  message: string
}) {
  return (
    error.code === "PGRST205" ||
    error.message.includes("product_modifier_option_overrides") ||
    error.message.includes("schema cache")
  )
}

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

async function assertProduct(businessId: string, productId: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected product is invalid.")
  }
}

async function assertModifierGroup(businessId: string, modifierGroupId: string) {
  const { data, error } = await supabaseAdmin
    .from("modifier_groups")
    .select("id")
    .eq("id", modifierGroupId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected modifier group is invalid.")
  }
}

async function getNextSortOrder(businessId: string, productId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("sort_order")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Could not load modifier assignment order: ${error.message}`)
  }

  return (data?.[0]?.sort_order ?? -1) + 1
}

async function getModifierOptionIds(
  businessId: string,
  modifierGroupId: string
) {
  const { data, error } = await supabaseAdmin
    .from("modifier_options")
    .select("id")
    .eq("business_id", businessId)
    .eq("modifier_group_id", modifierGroupId)

  if (error) {
    throw new Error(`Could not load modifier options: ${error.message}`)
  }

  return (data ?? []).map((option) => option.id as string)
}

async function deleteProductModifierOptionOverrides({
  businessId,
  productId,
  modifierGroupId,
}: {
  businessId: string
  productId: string
  modifierGroupId: string
}) {
  const optionIds = await getModifierOptionIds(businessId, modifierGroupId)

  if (optionIds.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_modifier_option_overrides")
    .delete()
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .in("modifier_option_id", optionIds)

  if (error) {
    if (isMissingModifierOverrideTableError(error)) {
      return
    }

    throw new Error(`Could not remove product modifier overrides: ${error.message}`)
  }
}

async function deleteProductDefaultModifierOptions({
  businessId,
  productId,
  modifierGroupId,
}: {
  businessId: string
  productId: string
  modifierGroupId: string
}) {
  const { error } = await supabaseAdmin
    .from("product_default_modifier_options")
    .delete()
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("modifier_group_id", modifierGroupId)

  if (error) {
    throw new Error(
      `Could not remove product modifier defaults: ${error.message}`
    )
  }
}

async function deleteProductIncludedModifierGroup({
  businessId,
  productId,
  modifierGroupId,
}: {
  businessId: string
  productId: string
  modifierGroupId: string
}) {
  const { error } = await supabaseAdmin
    .from("product_included_modifier_groups")
    .delete()
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("modifier_group_id", modifierGroupId)

  if (error) {
    throw new Error(
      `Could not remove included modifier settings: ${error.message}`
    )
  }
}

function getActionBusinessSlug(context: ProductAdminActionContext) {
  return context.isScoped ? context.businessSlug : undefined
}

function revalidateProductModifierPaths({
  context,
  productId,
}: {
  context: ProductAdminActionContext
  productId: string
}) {
  const businessSlug = getActionBusinessSlug(context)

  revalidatePath(getProductAdminActionHref(context))
  revalidatePath(getProductModifierGroupsHref(undefined, businessSlug))
  revalidatePath(getProductModifierGroupsHref(productId, businessSlug))
  revalidatePath(getProductDetailHref(productId, businessSlug))
  if (!context.isScoped) {
    revalidatePath("/admin/modifiers")
  }
  revalidatePath("/menu")
}

export async function attachProductModifierGroup(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const productId = parseString(formData.get("productId"), "Product")
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )

  await Promise.all([
    assertProduct(context.businessId, productId),
    assertModifierGroup(context.businessId, modifierGroupId),
  ])

  const { error } = await supabaseAdmin.from("product_modifier_groups").upsert(
    {
      business_id: context.businessId,
      product_id: productId,
      modifier_group_id: modifierGroupId,
      is_enabled: true,
      sort_order: await getNextSortOrder(context.businessId, productId),
    },
    {
      onConflict: "product_id,modifier_group_id",
    }
  )

  if (error) {
    throw new Error(`Could not attach modifier group: ${error.message}`)
  }

  revalidateProductModifierPaths({ context, productId })
}

export async function detachProductModifierGroup(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const productId = parseString(formData.get("productId"), "Product")
  const assignmentId = parseString(formData.get("assignmentId"), "Assignment")
  await assertProduct(context.businessId, productId)

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("id, product_id, modifier_group_id")
    .eq("id", assignmentId)
    .eq("business_id", context.businessId)
    .eq("product_id", productId)
    .single()

  if (assignmentError || !assignment) {
    throw new Error("Selected modifier group assignment is invalid.")
  }

  await deleteProductModifierOptionOverrides({
    businessId: context.businessId,
    productId,
    modifierGroupId: assignment.modifier_group_id as string,
  })
  await deleteProductDefaultModifierOptions({
    businessId: context.businessId,
    productId,
    modifierGroupId: assignment.modifier_group_id as string,
  })
  await deleteProductIncludedModifierGroup({
    businessId: context.businessId,
    productId,
    modifierGroupId: assignment.modifier_group_id as string,
  })

  const { error } = await supabaseAdmin
    .from("product_modifier_groups")
    .delete()
    .eq("id", assignmentId)
    .eq("business_id", context.businessId)
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not detach modifier group: ${error.message}`)
  }

  revalidateProductModifierPaths({ context, productId })
}
