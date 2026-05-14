"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"

const BUSINESS_SLUG = "pronto-demo"
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

async function getBusinessAndMenu() {
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (businessError || !business) {
    throw new Error("Could not load product business.")
  }

  const { data: menu, error: menuError } = await supabaseAdmin
    .from("menus")
    .select("id")
    .eq("business_id", business.id)
    .eq("name", MENU_NAME)
    .single()

  if (menuError || !menu) {
    throw new Error("Could not load product menu.")
  }

  return {
    businessId: business.id as string,
    menuId: menu.id as string,
  }
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

export async function saveProductSubcategory(formData: FormData) {
  const { businessId, menuId } = await getBusinessAndMenu()
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
    businessId,
    menuId,
    parentCategoryId,
  })

  if (subcategoryId) {
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
      .eq("business_id", businessId)
      .eq("menu_id", menuId)
      .not("parent_group_id", "is", null)

    if (error) {
      throw new Error(`Could not update product subcategory: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin.from("menu_groups").insert({
      business_id: businessId,
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

  revalidatePath("/admin/products")
  revalidatePath("/admin/products/subcategories")
  revalidatePath("/admin/products/list")
  revalidatePath("/menu")
}
