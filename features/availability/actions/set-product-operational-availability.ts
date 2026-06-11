"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductAdminActionRevalidatePaths,
  resolveProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"
import {
  parseOperational86Flag,
  parseOperationalExpiresAt,
  parseOperationalReason,
} from "@/features/availability/utils/operational-availability-form"

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

export async function setProductOperationalAvailability(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const productId = parseString(formData.get("productId"), "Product")
  const is86d = parseOperational86Flag(formData.get("is86d"))
  const reason = parseOperationalReason(formData.get("reason"))
  const expiresAt = parseOperationalExpiresAt(formData.get("expiresAt"))

  await assertProduct(context.businessId, productId)

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("product_operational_availability")
    .select("id")
    .eq("business_id", context.businessId)
    .eq("product_id", productId)
    .is("location_id", null)
    .maybeSingle()

  if (existingError) {
    throw new Error(
      `Could not load product temporary availability: ${existingError.message}`
    )
  }

  const payload = {
    business_id: context.businessId,
    location_id: null,
    product_id: productId,
    is_86d: is86d,
    reason: is86d ? reason : null,
    expires_at: is86d ? expiresAt : null,
  }

  const result = existing
    ? await supabaseAdmin
        .from("product_operational_availability")
        .update(payload)
        .eq("id", existing.id)
        .eq("business_id", context.businessId)
    : await supabaseAdmin.from("product_operational_availability").insert(payload)

  if (result.error) {
    throw new Error(
      `Could not update product temporary availability: ${result.error.message}`
    )
  }

  getProductAdminActionRevalidatePaths({ context, productId }).forEach(
    (path) => revalidatePath(path)
  )
  revalidatePath("/menu")
  revalidatePath(`/businesses/${context.businessSlug}/menu`)
  revalidatePath(`/businesses/${context.businessSlug}/specials`)
}
