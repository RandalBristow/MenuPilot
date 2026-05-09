"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStaffOrderScope } from "@/features/staff-orders/queries/get-orders"
import {
  canTransitionStaffOrderStatus,
  isStaffOrderActionStatus,
  type StaffOrderActionStatus,
} from "@/features/staff-orders/types/staff-order"

function parseStatus(
  status: FormDataEntryValue | null
): StaffOrderActionStatus {
  if (typeof status === "string" && isStaffOrderActionStatus(status)) {
    return status
  }

  throw new Error("Invalid order status.")
}

function getTimestampFields(status: StaffOrderActionStatus) {
  if (status === "accepted") return { accepted_at: new Date().toISOString() }
  if (status === "ready") return { ready_at: new Date().toISOString() }
  if (status === "completed") return { completed_at: new Date().toISOString() }
  if (status === "canceled") return { cancelled_at: new Date().toISOString() }

  return {}
}

export async function updateOrderStatus(formData: FormData) {
  const orderId = formData.get("orderId")
  const status = parseStatus(formData.get("status"))

  if (typeof orderId !== "string" || orderId.length === 0) {
    throw new Error("Missing order ID.")
  }

  const { businessId, locationId } = await getStaffOrderScope()

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("order_status")
    .eq("id", orderId)
    .eq("business_id", businessId)
    .eq("location_id", locationId)
    .single()

  if (orderError || !order) {
    throw new Error("Could not load order.")
  }

  if (!canTransitionStaffOrderStatus(order.order_status, status)) {
    throw new Error("That status change is not allowed.")
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      order_status: status,
      ...getTimestampFields(status),
    })
    .eq("id", orderId)
    .eq("business_id", businessId)
    .eq("location_id", locationId)

  if (error) {
    throw new Error(`Could not update order status: ${error.message}`)
  }

  revalidatePath("/staff/orders")
}
