"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"

const BUSINESS_SLUG = "pronto-demo"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

async function getBusinessId() {
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (error || !business) {
    throw new Error("Could not load product business.")
  }

  return business.id as string
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
    throw new Error(`Could not remove product modifier overrides: ${error.message}`)
  }
}

function revalidateProductModifierPaths(productId: string) {
  revalidatePath("/admin/products")
  revalidatePath("/admin/products/modifier-groups")
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/admin/modifiers")
  revalidatePath("/menu")
}

export async function attachProductModifierGroup(formData: FormData) {
  const businessId = await getBusinessId()
  const productId = parseString(formData.get("productId"), "Product")
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )

  await Promise.all([
    assertProduct(businessId, productId),
    assertModifierGroup(businessId, modifierGroupId),
  ])

  const { error } = await supabaseAdmin.from("product_modifier_groups").upsert(
    {
      business_id: businessId,
      product_id: productId,
      modifier_group_id: modifierGroupId,
      is_enabled: true,
      sort_order: await getNextSortOrder(businessId, productId),
    },
    {
      onConflict: "product_id,modifier_group_id",
    }
  )

  if (error) {
    throw new Error(`Could not attach modifier group: ${error.message}`)
  }

  revalidateProductModifierPaths(productId)
}

export async function detachProductModifierGroup(formData: FormData) {
  const businessId = await getBusinessId()
  const productId = parseString(formData.get("productId"), "Product")
  const assignmentId = parseString(formData.get("assignmentId"), "Assignment")

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("id, product_id, modifier_group_id")
    .eq("id", assignmentId)
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .single()

  if (assignmentError || !assignment) {
    throw new Error("Selected modifier group assignment is invalid.")
  }

  await deleteProductModifierOptionOverrides({
    businessId,
    productId,
    modifierGroupId: assignment.modifier_group_id as string,
  })

  const { error } = await supabaseAdmin
    .from("product_modifier_groups")
    .delete()
    .eq("id", assignmentId)
    .eq("business_id", businessId)
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not detach modifier group: ${error.message}`)
  }

  revalidateProductModifierPaths(productId)
}
