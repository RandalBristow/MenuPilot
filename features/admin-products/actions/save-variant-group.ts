"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductAdminActionHref,
  resolveProductAdminActionContext,
  type ProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"
import { getVariantGroupDetailHref } from "@/features/admin-products/utils/product-admin-routes"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseNullableString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function parseSortOrder(value: FormDataEntryValue | null) {
  const sortOrder = Number(value)

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be zero or greater.")
  }

  return sortOrder
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true"
}

async function assertVariantGroup(businessId: string, groupId: string | null) {
  if (!groupId) return

  const { data, error } = await supabaseAdmin
    .from("variant_groups")
    .select("id")
    .eq("id", groupId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected variant group is invalid.")
  }
}

function getVariantGroupDetailActionHref({
  context,
  groupId,
}: {
  context: ProductAdminActionContext
  groupId: string
}) {
  return getVariantGroupDetailHref({
    groupId,
    businessSlug: context.isScoped ? context.businessSlug : undefined,
  })
}

function revalidateVariantGroupPaths({
  context,
  groupId,
}: {
  context: ProductAdminActionContext
  groupId: string | null
}) {
  revalidatePath(getProductAdminActionHref(context))
  revalidatePath(getProductAdminActionHref(context, "variant-groups"))
  if (groupId) {
    revalidatePath(getVariantGroupDetailActionHref({ context, groupId }))
  }
  revalidatePath("/menu")
}

export async function saveVariantGroup(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const groupId = parseNullableString(formData.get("groupId"))
  const name = parseString(formData.get("name"), "Variant group name")
  const description = parseNullableString(formData.get("description"))
  const sortOrder = parseSortOrder(formData.get("sortOrder"))
  const isEnabled = parseBoolean(formData.get("isEnabled"))

  await assertVariantGroup(context.businessId, groupId)

  if (groupId) {
    const { error } = await supabaseAdmin
      .from("variant_groups")
      .update({
        name,
        description,
        is_enabled: isEnabled,
        sort_order: sortOrder,
      })
      .eq("id", groupId)
      .eq("business_id", context.businessId)

    if (error) {
      throw new Error(`Could not update variant group: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin.from("variant_groups").insert({
      business_id: context.businessId,
      name,
      description,
      is_enabled: isEnabled,
      sort_order: sortOrder,
    })

    if (error) {
      throw new Error(`Could not create variant group: ${error.message}`)
    }
  }

  revalidateVariantGroupPaths({ context, groupId })
}
