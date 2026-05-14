"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  buildProductPayload,
  createSlug,
} from "@/features/admin-products/utils/build-product-payload"

const BUSINESS_SLUG = "pronto-demo"

function parseProductId(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Product id is required.")
  }

  return value.trim()
}

function parseEnabled(value: FormDataEntryValue | null) {
  return value === "true"
}

function parseRedirectTo(value: FormDataEntryValue | null, productId: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "/admin/products"
  }

  const redirectTo = value.trim()

  if (
    redirectTo === "/admin/products" ||
    redirectTo === `/admin/products/${productId}` ||
    redirectTo === `/admin/products/variants?productId=${productId}` ||
    redirectTo === `/admin/products/modifier-groups?productId=${productId}`
  ) {
    return redirectTo
  }

  return "/admin/products"
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
    throw new Error("Product could not be found.")
  }
}

async function assertMenuGroup(businessId: string, menuGroupId: string) {
  const { data, error } = await supabaseAdmin
    .from("menu_groups")
    .select("id")
    .eq("id", menuGroupId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected category is invalid.")
  }
}

async function assertModifierGroups(
  businessId: string,
  modifierGroupIds: string[]
) {
  if (modifierGroupIds.length === 0) return

  const { data, error } = await supabaseAdmin
    .from("modifier_groups")
    .select("id")
    .eq("business_id", businessId)
    .in("id", modifierGroupIds)

  if (error) {
    throw new Error(`Could not validate modifier groups: ${error.message}`)
  }

  if ((data ?? []).length !== modifierGroupIds.length) {
    throw new Error("One or more selected modifier groups are invalid.")
  }
}

export async function updateProduct(formData: FormData) {
  const businessId = await getBusinessId()
  const productId = parseProductId(formData.get("productId"))
  const { product: productPayload, menuGroupId, modifierGroupIds, variants } =
    buildProductPayload(formData)
  const isEnabled = parseEnabled(formData.get("isEnabled"))
  const redirectTo = parseRedirectTo(formData.get("redirectTo"), productId)

  await assertProduct(businessId, productId)
  await assertMenuGroup(businessId, menuGroupId)
  await assertModifierGroups(businessId, modifierGroupIds)

  const { error: productError } = await supabaseAdmin
    .from("products")
    .update({
      name: productPayload.name,
      slug: createSlug(productPayload.name),
      description: productPayload.description,
      base_price: productPayload.base_price,
      builder_template: productPayload.builder_template,
      has_variants: productPayload.has_variants,
      is_enabled: isEnabled,
    })
    .eq("id", productId)
    .eq("business_id", businessId)

  if (productError) {
    throw new Error(`Could not update product: ${productError.message}`)
  }

  const { error: deleteProductGroupsError } = await supabaseAdmin
    .from("product_groups")
    .delete()
    .eq("product_id", productId)
    .eq("business_id", businessId)

  if (deleteProductGroupsError) {
    throw new Error(
      `Could not update product category: ${deleteProductGroupsError.message}`
    )
  }

  const { error: productGroupError } = await supabaseAdmin
    .from("product_groups")
    .insert({
      business_id: businessId,
      product_id: productId,
      menu_group_id: menuGroupId,
      is_primary: true,
    })

  if (productGroupError) {
    throw new Error(
      `Could not attach product category: ${productGroupError.message}`
    )
  }

  const { error: deleteModifierGroupsError } = await supabaseAdmin
    .from("product_modifier_groups")
    .delete()
    .eq("product_id", productId)
    .eq("business_id", businessId)

  if (deleteModifierGroupsError) {
    throw new Error(
      `Could not update modifier groups: ${deleteModifierGroupsError.message}`
    )
  }

  if (modifierGroupIds.length > 0) {
    const { error: modifierGroupError } = await supabaseAdmin
      .from("product_modifier_groups")
      .insert(
        modifierGroupIds.map((modifierGroupId, index) => ({
          business_id: businessId,
          product_id: productId,
          modifier_group_id: modifierGroupId,
          is_enabled: true,
          sort_order: index,
        }))
      )

    if (modifierGroupError) {
      throw new Error(
        `Could not attach modifier groups: ${modifierGroupError.message}`
      )
    }
  }

  for (const variant of variants) {
    if (variant.id) {
      const { error: variantError } = await supabaseAdmin
        .from("product_variants")
        .update({
          name: variant.name,
          base_price: variant.base_price,
          is_default: variant.is_default,
          is_enabled: variant.is_enabled,
          sort_order: variant.sort_order,
        })
        .eq("id", variant.id)
        .eq("product_id", productId)
        .eq("business_id", businessId)

      if (variantError) {
        throw new Error(`Could not update variant: ${variantError.message}`)
      }

      continue
    }

    const { error: variantError } = await supabaseAdmin
      .from("product_variants")
      .insert({
        business_id: businessId,
        product_id: productId,
        name: variant.name,
        base_price: variant.base_price,
        is_default: variant.is_default,
        is_enabled: variant.is_enabled,
        sort_order: variant.sort_order,
      })

    if (variantError) {
      throw new Error(`Could not create variant: ${variantError.message}`)
    }
  }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/menu")
  redirect(redirectTo)
}
