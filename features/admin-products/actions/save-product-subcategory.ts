"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductAdminActionHref,
  resolveProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"

const MENU_NAME = "Main Menu"

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

async function getMenuId(businessId: string) {
  const { data: menu, error: menuError } = await supabaseAdmin
    .from("menus")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", MENU_NAME)
    .single()

  if (menuError || !menu) {
    throw new Error("Could not load product menu.")
  }

  return menu.id as string
}

async function assertParentCategory({
  businessId,
  menuId,
  parentCategoryId,
}: {
  businessId: string
  menuId: string
  parentCategoryId: string
}) {
  const { data: category, error } = await supabaseAdmin
    .from("menu_groups")
    .select("id")
    .eq("id", parentCategoryId)
    .eq("business_id", businessId)
    .eq("menu_id", menuId)
    .is("parent_group_id", null)
    .single()

  if (error || !category) {
    throw new Error("Selected parent category is invalid.")
  }
}

async function assertSubcategoryBelongsToBusiness({
  businessId,
  menuId,
  subcategoryId,
}: {
  businessId: string
  menuId: string
  subcategoryId: string
}) {
  const { data: subcategory, error } = await supabaseAdmin
    .from("menu_groups")
    .select("id")
    .eq("id", subcategoryId)
    .eq("business_id", businessId)
    .eq("menu_id", menuId)
    .not("parent_group_id", "is", null)
    .single()

  if (error || !subcategory) {
    throw new Error("Subcategory could not be found.")
  }
}

function revalidateSubcategoryPaths(
  context: Awaited<ReturnType<typeof resolveProductAdminActionContext>>
) {
  revalidatePath(getProductAdminActionHref(context))
  revalidatePath(getProductAdminActionHref(context, "categories"))
  revalidatePath(getProductAdminActionHref(context, "subcategories"))
  revalidatePath(getProductAdminActionHref(context, "list"))
  revalidatePath("/menu")
}

export async function saveProductSubcategory(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const menuId = await getMenuId(context.businessId)
  const subcategoryId = parseNullableString(formData.get("subcategoryId"))
  const parentCategoryId = parseString(
    formData.get("parentCategoryId"),
    "Parent category"
  )
  const name = parseString(formData.get("name"), "Subcategory name")
  const description = parseNullableString(formData.get("description"))
  const sortOrder = parseSortOrder(formData.get("sortOrder"))
  const isEnabled = parseEnabled(formData.get("isEnabled"))

  await assertParentCategory({
    businessId: context.businessId,
    menuId,
    parentCategoryId,
  })

  if (subcategoryId) {
    await assertSubcategoryBelongsToBusiness({
      businessId: context.businessId,
      menuId,
      subcategoryId,
    })

    const { error } = await supabaseAdmin
      .from("menu_groups")
      .update({
        parent_group_id: parentCategoryId,
        name,
        description,
        sort_order: sortOrder,
        is_enabled: isEnabled,
      })
      .eq("id", subcategoryId)
      .eq("business_id", context.businessId)
      .eq("menu_id", menuId)
      .not("parent_group_id", "is", null)

    if (error) {
      throw new Error(`Could not update product subcategory: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin.from("menu_groups").insert({
      business_id: context.businessId,
      menu_id: menuId,
      parent_group_id: parentCategoryId,
      name,
      description,
      sort_order: sortOrder,
      is_enabled: isEnabled,
    })

    if (error) {
      throw new Error(`Could not create product subcategory: ${error.message}`)
    }
  }

  revalidateSubcategoryPaths(context)
}
