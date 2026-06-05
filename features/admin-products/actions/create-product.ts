"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { buildProductPayload } from "@/features/admin-products/utils/build-product-payload"
import {
  getProductAdminActionHref,
  getProductAdminActionRevalidatePaths,
  resolveProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"

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

async function assertMediaAsset(
  businessId: string,
  mediaAssetId: string | null
) {
  if (!mediaAssetId) return

  const { data, error } = await supabaseAdmin
    .from("media_assets")
    .select("id")
    .eq("business_id", businessId)
    .eq("id", mediaAssetId)
    .eq("is_archived", false)
    .single()

  if (error || !data) {
    throw new Error("Selected product image is invalid.")
  }
}

export async function createProduct(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const { businessId } = context
  const { product: productPayload, menuGroupId, modifierGroupIds } =
    buildProductPayload(formData)

  await assertMenuGroup(businessId, menuGroupId)
  await assertModifierGroups(businessId, modifierGroupIds)
  await assertMediaAsset(businessId, productPayload.image_media_id)

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .insert({
      business_id: businessId,
      ...productPayload,
    })
    .select("id")
    .single()

  if (productError || !product) {
    throw new Error(`Could not create product: ${productError?.message}`)
  }

  const productId = product.id as string

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

  getProductAdminActionRevalidatePaths({ context, productId }).forEach(
    (path) => revalidatePath(path)
  )
  revalidatePath("/menu")
  redirect(
    context.isScoped
      ? getProductAdminActionHref(context, "list")
      : getProductAdminActionHref(context)
  )
}
