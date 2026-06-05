"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { CartItem } from "@/features/cart/types/cart"
import {
  buildOrderInsertPayload,
  buildOrderItemInsertPayload,
  buildOrderModifierInsertPayload,
} from "@/features/checkout/utils/build-order-payload"
import { loadCheckoutProductConfig } from "@/features/checkout/queries/load-checkout-product-config"
import { validateAndPriceCart } from "@/features/checkout/utils/validate-and-price-cart"
import { buildCheckoutValidationFailure } from "@/features/checkout/utils/checkout-action-result"
import {
  getCheckoutOrderability,
  validateCartTenantContext,
} from "@/features/checkout/utils/checkout-tenant-context"
import { resolveCheckoutTenantContext } from "@/features/checkout/utils/resolve-checkout-tenant-context"

type CreateOrderInput = {
  customerName: string
  customerPhone: string
  customerEmail?: string
  fulfillmentType: "pickup" | "delivery"
  specialInstructions?: string
  items: CartItem[]
  businessSlug?: string | null
  locationSlug?: string | null
}

export type CreateOrderResult =
  | {
      ok: true
      orderId: string
      orderNumber: string
    }
  | {
      ok: false
      error: string
    }

function generateOrderNumber() {
  const now = Date.now().toString().slice(-6)
  const random = Math.floor(100 + Math.random() * 900)

  return `MP-${now}${random}`
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  if (!input.customerName.trim()) {
    return buildCheckoutValidationFailure([
      { message: "Customer name is required." },
    ])
  }

  if (!input.customerPhone.trim()) {
    return buildCheckoutValidationFailure([
      { message: "Customer phone is required." },
    ])
  }

  if (!input.items.length) {
    return buildCheckoutValidationFailure([{ message: "Cart is empty." }])
  }

  const tenantContext = await resolveCheckoutTenantContext({
    businessSlug: input.businessSlug,
    locationSlug: input.locationSlug,
  })

  if (!tenantContext) {
    return buildCheckoutValidationFailure([
      { message: "This checkout is not available right now." },
    ])
  }

  const orderability = getCheckoutOrderability({
    business: tenantContext.business,
    location: tenantContext.location,
    fulfillmentType: input.fulfillmentType,
  })

  if (!orderability.ok) {
    return buildCheckoutValidationFailure([{ message: orderability.reason }])
  }

  const cartTenantValidation = validateCartTenantContext({
    items: input.items,
    business: tenantContext.business,
    allowLegacyItems: tenantContext.isLegacyDemo,
  })

  if (!cartTenantValidation.ok) {
    return buildCheckoutValidationFailure([
      { message: cartTenantValidation.reason },
    ])
  }

  const productConfigs = await loadCheckoutProductConfig({
    businessId: tenantContext.business.id,
    productIds: input.items.map((item) => item.productId),
  })
  const validationResult = validateAndPriceCart({
    items: input.items,
    products: productConfigs,
  })

  if (!validationResult.ok) {
    return buildCheckoutValidationFailure(validationResult.errors)
  }

  const validatedItems = validationResult.cart.items

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert(
      buildOrderInsertPayload({
        businessId: tenantContext.business.id,
        locationId: tenantContext.location.id,
        orderNumber: generateOrderNumber(),
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        fulfillmentType: input.fulfillmentType,
        specialInstructions: input.specialInstructions,
        items: validatedItems,
      })
    )
    .select("id, order_number")
    .single()

  if (orderError || !order) {
    throw new Error(`Could not create order: ${orderError?.message}`)
  }

  for (const item of validatedItems) {
    const { data: orderItem, error: orderItemError } = await supabaseAdmin
      .from("order_items")
      .insert(
        buildOrderItemInsertPayload({
          businessId: tenantContext.business.id,
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
        businessId: tenantContext.business.id,
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
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number,
  }
}
