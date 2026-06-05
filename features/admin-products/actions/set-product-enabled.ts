"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductAdminActionRevalidatePaths,
  resolveProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseEnabled(value: FormDataEntryValue | null) {
  if (value === "true") return true
  if (value === "false") return false

  throw new Error("Enabled value is invalid.")
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

export async function setProductEnabled(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const { businessId } = context
  const productId = parseString(formData.get("productId"), "Product")
  const isEnabled = parseEnabled(formData.get("isEnabled"))

  await assertProduct(businessId, productId)

  const { error } = await supabaseAdmin
    .from("products")
    .update({ is_enabled: isEnabled })
    .eq("id", productId)
    .eq("business_id", businessId)

  if (error) {
    throw new Error(`Could not update product: ${error.message}`)
  }

  getProductAdminActionRevalidatePaths({ context, productId }).forEach(
    (path) => revalidatePath(path)
  )
  revalidatePath("/menu")
}
