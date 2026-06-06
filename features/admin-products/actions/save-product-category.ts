"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductAdminActionHref,
  resolveProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"
import { getOrCreateProductMenuId } from "@/features/admin-products/utils/product-menu"

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

function parseEnabled(value: FormDataEntryValue | null) {
  return value !== "false"
}

function parseSortOrder(value: FormDataEntryValue | null) {
  const sortOrder = Number(value)

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be zero or greater.")
  }

  return sortOrder
}

async function assertCategoryBelongsToBusiness({
  businessId,
  menuId,
  categoryId,
}: {
  businessId: string
  menuId: string
  categoryId: string
}) {
  const { data: category, error } = await supabaseAdmin
    .from("menu_groups")
    .select("id")
    .eq("id", categoryId)
    .eq("business_id", businessId)
    .eq("menu_id", menuId)
    .is("parent_group_id", null)
    .single()

  if (error || !category) {
    throw new Error("Category could not be found.")
  }
}

function revalidateCategoryPaths(context: Awaited<ReturnType<typeof resolveProductAdminActionContext>>) {
  revalidatePath(getProductAdminActionHref(context))
  revalidatePath(getProductAdminActionHref(context, "categories"))
  revalidatePath(getProductAdminActionHref(context, "subcategories"))
  revalidatePath(getProductAdminActionHref(context, "list"))
  revalidatePath("/menu")
}

export async function saveProductCategory(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const menuId = await getOrCreateProductMenuId(context.businessId)
  const categoryId = parseNullableString(formData.get("categoryId"))
  const name = parseString(formData.get("name"), "Category name")
  const description = parseNullableString(formData.get("description"))
  const sortOrder = parseSortOrder(formData.get("sortOrder"))
  const isEnabled = parseEnabled(formData.get("isEnabled"))

  if (categoryId) {
    await assertCategoryBelongsToBusiness({
      businessId: context.businessId,
      menuId,
      categoryId,
    })

    const { error } = await supabaseAdmin
      .from("menu_groups")
      .update({
        name,
        description,
        sort_order: sortOrder,
        is_enabled: isEnabled,
      })
      .eq("id", categoryId)
      .eq("business_id", context.businessId)
      .eq("menu_id", menuId)
      .is("parent_group_id", null)

    if (error) {
      throw new Error(`Could not update product category: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin.from("menu_groups").insert({
      business_id: context.businessId,
      menu_id: menuId,
      parent_group_id: null,
      name,
      description,
      sort_order: sortOrder,
      is_enabled: isEnabled,
    })

    if (error) {
      throw new Error(`Could not create product category: ${error.message}`)
    }
  }

  revalidateCategoryPaths(context)
}
