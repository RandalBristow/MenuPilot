"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getProductDeleteStrategy } from "@/features/admin-products/utils/get-product-delete-strategy"

const BUSINESS_SLUG = "pronto-demo"

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
  const businessId = await getBusinessId()
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

    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${productId}`)
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

  revalidatePath("/admin/products")
  revalidatePath("/menu")

  return {
    deleted: true,
    disabled: false,
    message: "Product deleted.",
  }
}
