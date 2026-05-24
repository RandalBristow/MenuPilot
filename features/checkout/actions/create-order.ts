"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { CartItem } from "@/features/cart/types/cart"
import {
  buildOrderInsertPayload,
  buildOrderItemInsertPayload,
  buildOrderModifierInsertPayload,
} from "@/features/checkout/utils/build-order-payload"

type CreateOrderInput = {
  customerName: string
  customerPhone: string
  customerEmail?: string
  fulfillmentType: "pickup" | "delivery"
  specialInstructions?: string
  items: CartItem[]
}

function generateOrderNumber() {
  const now = Date.now().toString().slice(-6)
  const random = Math.floor(100 + Math.random() * 900)

  return `MP-${now}${random}`
}

export async function createOrder(input: CreateOrderInput) {
  if (!input.customerName.trim()) {
    throw new Error("Customer name is required.")
  }

  if (!input.customerPhone.trim()) {
    throw new Error("Customer phone is required.")
  }

  if (!input.items.length) {
    throw new Error("Cart is empty.")
  }

  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("slug", "pronto-demo")
    .single()

  if (businessError || !business) {
    throw new Error("Could not load business.")
  }

  const { data: location, error: locationError } = await supabaseAdmin
    .from("locations")
    .select("id")
    .eq("business_id", business.id)
    .eq("slug", "main-street")
    .single()

  if (locationError || !location) {
    throw new Error("Could not load location.")
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert(
      buildOrderInsertPayload({
        businessId: business.id,
        locationId: location.id,
        orderNumber: generateOrderNumber(),
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        fulfillmentType: input.fulfillmentType,
        specialInstructions: input.specialInstructions,
        items: input.items,
      })
    )
    .select("id, order_number")
    .single()

  if (orderError || !order) {
    throw new Error(`Could not create order: ${orderError?.message}`)
  }

  for (const item of input.items) {
    const { data: orderItem, error: orderItemError } = await supabaseAdmin
      .from("order_items")
      .insert(
        buildOrderItemInsertPayload({
          businessId: business.id,
          orderId: order.id,
          item,
        })
      )
      .select("id")
      .single()

    if (orderItemError || !orderItem) {
      throw new Error(`Could not create order item: ${orderItemError?.message}`)
    }

    if (item.modifiers.length > 0) {
      const modifierRows = buildOrderModifierInsertPayload({
        businessId: business.id,
        orderItemId: orderItem.id,
        modifiers: item.modifiers,
      })

      const { error: modifierError } = await supabaseAdmin
        .from("order_item_modifiers")
        .insert(modifierRows)

      if (modifierError) {
        throw new Error(
          `Could not create order item modifiers: ${modifierError.message}`
        )
      }
    }
  }

  return {
    orderId: order.id,
    orderNumber: order.order_number,
  }
}
