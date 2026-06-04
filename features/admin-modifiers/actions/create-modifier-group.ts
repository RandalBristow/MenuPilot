"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"

const BUSINESS_SLUG = "pronto-demo"

type SelectionType = "single" | "multiple"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseSelectionType(value: FormDataEntryValue | null): SelectionType {
  if (value === "single" || value === "multiple") {
    return value
  }

  throw new Error("Selection type must be single or multiple.")
}

function parseRequired(value: FormDataEntryValue | null) {
  return value === "true"
}

function parseInteger(value: FormDataEntryValue | null, fieldName: string) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${fieldName} must be zero or greater.`)
  }

  return parsedValue
}

function parseOptionalInteger(
  value: FormDataEntryValue | null,
  fieldName: string
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return parseInteger(value, fieldName)
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

async function getNextSortOrder(businessId: string, categoryId: string) {
  const { data, error } = await supabaseAdmin
    .from("modifier_groups")
    .select("sort_order")
    .eq("business_id", businessId)
    .eq("modifier_category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Could not load modifier sort order: ${error.message}`)
  }

  return (data?.[0]?.sort_order ?? 0) + 1
}

export async function createModifierGroup(formData: FormData) {
  const businessId = await getBusinessId()
  const categoryId = parseString(formData.get("categoryId"), "Category")
  const name = parseString(formData.get("name"), "Group name")
  const selectionType = parseSelectionType(formData.get("selectionType"))
  const isRequired = parseRequired(formData.get("isRequired"))
  const minRequired = parseInteger(formData.get("minRequired"), "Minimum")
  const maxAllowed = parseOptionalInteger(formData.get("maxAllowed"), "Maximum")
  const requestedSortOrder = parseOptionalInteger(
    formData.get("sortOrder"),
    "Sort order"
  )

  if (maxAllowed !== null && maxAllowed < minRequired) {
    throw new Error("Maximum must be greater than or equal to minimum.")
  }

  const { data: category, error: categoryError } = await supabaseAdmin
    .from("modifier_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("business_id", businessId)
    .single()

  if (categoryError || !category) {
    throw new Error("Selected modifier category is invalid.")
  }

  const sortOrder =
    requestedSortOrder ?? (await getNextSortOrder(businessId, categoryId))

  const { error } = await supabaseAdmin.from("modifier_groups").insert({
    business_id: businessId,
    modifier_category_id: categoryId,
    name,
    selection_type: selectionType,
    min_required: minRequired,
    max_allowed: maxAllowed,
    is_required: isRequired,
    is_enabled: true,
    sort_order: sortOrder,
  })

  if (error) {
    throw new Error(`Could not create modifier group: ${error.message}`)
  }

  revalidatePath("/admin/modifiers")
  revalidatePath("/admin/modifiers/groups")
  revalidatePath("/admin/modifiers/subgroups")
  revalidatePath("/admin/modifiers/options")
}
