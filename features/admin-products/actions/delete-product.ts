"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getProductDeleteStrategy } from "@/features/admin-products/utils/get-product-delete-strategy"
import {
  getProductAdminActionRevalidatePaths,
  resolveProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"

export type DeleteProductResult = {
  deleted: boolean
  disabled: boolean
  message: string
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
    throw new Error("Product could not be found.")
  }
}

async function hasOrderUsage(businessId: string, productId: string) {
  const { data, error } = await supabaseAdmin
    .from("order_items")
    .select("id")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .limit(1)

  if (error) {
    throw new Error(`Could not check order usage: ${error.message}`)
  }

  return (data ?? []).length > 0
}

export async function deleteProduct(
  formData: FormData
): Promise<DeleteProductResult> {
  const context = await resolveProductAdminActionContext(formData)
  const { businessId } = context
  const productId = parseString(formData.get("productId"), "Product")

  await assertProduct(businessId, productId)

  if (getProductDeleteStrategy(await hasOrderUsage(businessId, productId)) === "disable") {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_enabled: false })
      .eq("id", productId)
      .eq("business_id", businessId)

    if (error) {
      throw new Error(`Could not disable product: ${error.message}`)
    }

    getProductAdminActionRevalidatePaths({ context, productId }).forEach(
      (path) => revalidatePath(path)
    )
    revalidatePath("/menu")

    return {
      deleted: false,
      disabled: true,
      message:
        "This product has order history, so it was disabled instead of permanently deleted.",
    }
  }

  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("business_id", businessId)

  if (error) {
    throw new Error(`Could not delete product: ${error.message}`)
  }

  getProductAdminActionRevalidatePaths({ context }).forEach((path) =>
    revalidatePath(path)
  )
  revalidatePath("/menu")

  return {
    deleted: true,
    disabled: false,
    message: "Product deleted.",
  }
}
