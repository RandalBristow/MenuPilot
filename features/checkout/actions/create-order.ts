"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { CartItem } from "@/features/cart/types/cart"

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

  const subtotal = input.items.reduce((sum, item) => sum + item.totalPrice, 0)

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      business_id: business.id,
      location_id: location.id,
      order_number: generateOrderNumber(),
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail?.trim() || null,
      customer_phone: input.customerPhone.trim(),
      fulfillment_type: input.fulfillmentType,
      order_status: "new",
      payment_status: "unpaid",
      subtotal,
      discount_total: 0,
      tax_total: 0,
      tip_total: 0,
      charge_total: 0,
      delivery_fee: 0,
      total: subtotal,
      special_instructions: input.specialInstructions?.trim() || null,
    })
    .select("id, order_number")
    .single()

  if (orderError || !order) {
    throw new Error(`Could not create order: ${orderError?.message}`)
  }

  for (const item of input.items) {
    const { data: orderItem, error: orderItemError } = await supabaseAdmin
      .from("order_items")
      .insert({
        business_id: business.id,
        order_id: order.id,
        product_id: item.productId,
        product_variant_id: item.variantId,
        product_name_snapshot: item.productName,
        variant_name_snapshot: item.variantName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_subtotal: item.totalPrice,
      })
      .select("id")
      .single()

    if (orderItemError || !orderItem) {
      throw new Error(`Could not create order item: ${orderItemError?.message}`)
    }

    if (item.modifiers.length > 0) {
      const modifierRows = item.modifiers.map((modifier) => ({
        business_id: business.id,
        order_item_id: orderItem.id,
        group_name_snapshot: modifier.groupName,
        option_name_snapshot: modifier.optionName,
        placement: modifier.placement,
        multiplier: modifier.multiplier,
        price_delta: modifier.priceDelta,
        quantity: 1,
      }))

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