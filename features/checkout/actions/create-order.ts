"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { CartItem } from "@/features/cart/types/cart"
import {
  isConfiguredCartItem,
  isDealCartItem,
} from "@/features/cart/utils/cart-items"
import {
  buildDealChildOrderItemInsertPayload,
  buildDealParentOrderItemInsertPayload,
  buildOrderDiscountInsertPayload,
  buildOrderInsertPayload,
  buildOrderItemInsertPayload,
  buildOrderModifierInsertPayload,
  getPassiveSpecialEligibleItems,
} from "@/features/checkout/utils/build-order-payload"
import { loadCheckoutProductConfig } from "@/features/checkout/queries/load-checkout-product-config"
import { loadActiveSpecialsForCheckout } from "@/features/specials/queries/load-active-specials-for-checkout"
import { loadMixAndMatchDealsForCheckout } from "@/features/specials/queries/load-mix-and-match-deals-for-checkout"
import { loadOrderableDealsForCheckout } from "@/features/specials/queries/load-orderable-deals-for-checkout"
import {
  validateAndPriceCheckoutItems,
  type ValidatedPricedDealItem,
} from "@/features/checkout/utils/validate-and-price-checkout-items"
import type { ValidatedPricedCartItem } from "@/features/checkout/utils/validate-and-price-cart"
import { applySpecialsToPricedCart } from "@/features/specials/utils/apply-specials-to-priced-cart"
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

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function isValidatedDealItem(
  item: ValidatedPricedCartItem | ValidatedPricedDealItem
): item is ValidatedPricedDealItem {
  return "itemType" in item && item.itemType === "deal"
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

  const productIds = input.items.flatMap((item) => {
    if (isConfiguredCartItem(item)) return [item.productId]
    if (isDealCartItem(item)) {
      return item.components.flatMap((component) =>
        component.children.map((child) => child.productId)
      )
    }

    return []
  })
  const currentTime = new Date()
  const productConfigs = await loadCheckoutProductConfig({
    businessId: tenantContext.business.id,
    productIds,
  })
  const dealCartItems = input.items.filter(isDealCartItem)
  const dealsById = await loadOrderableDealsForCheckout({
    businessId: tenantContext.business.id,
    specialIds: dealCartItems
      .filter((item) => item.specialType !== "mix_and_match_fixed_unit_price")
      .map((item) => item.specialId),
    currentTime,
    timeZone: tenantContext.location.timezone,
  })
  const mixAndMatchDealsById = await loadMixAndMatchDealsForCheckout({
    businessId: tenantContext.business.id,
    specialIds: dealCartItems
      .filter((item) => item.specialType === "mix_and_match_fixed_unit_price")
      .map((item) => item.specialId),
    currentTime,
    timeZone: tenantContext.location.timezone,
  })
  const validationResult = validateAndPriceCheckoutItems({
    items: input.items,
    products: productConfigs,
    dealsById,
    mixAndMatchDealsById,
    businessId: tenantContext.business.id,
    currentTime,
    timeZone: tenantContext.location.timezone,
  })

  if (!validationResult.ok) {
    return buildCheckoutValidationFailure(validationResult.errors)
  }

  const validatedItems = validationResult.cart.items
  const passiveSpecialEligibleItems = getPassiveSpecialEligibleItems(validatedItems)
  const activeSpecials = await loadActiveSpecialsForCheckout({
    businessId: tenantContext.business.id,
    currentTime,
    timeZone: tenantContext.location.timezone,
  })
  const specialsPricing = applySpecialsToPricedCart({
    businessId: tenantContext.business.id,
    locationId: tenantContext.location.id,
    currentTime,
    lines: passiveSpecialEligibleItems.map((item) => ({
      lineId: item.cartItemId,
      orderItemId: null,
      productId: item.productId,
      variantGroupOptionId: item.variantId,
      quantity: item.quantity,
      lineSubtotal: item.lineSubtotal,
      productNameSnapshot: item.productName,
    })),
    specials: activeSpecials,
  })
  const orderTotal = roundCurrency(
    Math.max(0, validationResult.cart.subtotal - specialsPricing.discountTotal)
  )

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
        discountTotal: specialsPricing.discountTotal,
        total: orderTotal,
      })
    )
    .select("id, order_number")
    .single()

  if (orderError || !order) {
    throw new Error(`Could not create order: ${orderError?.message}`)
  }

  const orderItemIdsByLineId = new Map<string, string>()

  for (const item of validatedItems) {
    if (isValidatedDealItem(item)) {
      const { data: parentOrderItem, error: parentOrderItemError } =
        await supabaseAdmin
          .from("order_items")
          .insert(
            buildDealParentOrderItemInsertPayload({
              businessId: tenantContext.business.id,
              orderId: order.id,
              item,
            })
          )
          .select("id")
          .single()

      if (parentOrderItemError || !parentOrderItem) {
        throw new Error(
          `Could not create deal order item: ${parentOrderItemError?.message}`
        )
      }

      orderItemIdsByLineId.set(item.cartItemId, parentOrderItem.id)

      for (const component of item.components) {
        for (const child of component.children) {
          const { data: childOrderItem, error: childOrderItemError } =
            await supabaseAdmin
              .from("order_items")
              .insert(
                buildDealChildOrderItemInsertPayload({
                  businessId: tenantContext.business.id,
                  orderId: order.id,
                  parentOrderItemId: parentOrderItem.id,
                  child,
                })
              )
              .select("id")
              .single()

          if (childOrderItemError || !childOrderItem) {
            throw new Error(
              `Could not create deal child order item: ${childOrderItemError?.message}`
            )
          }

          if (child.modifiers.length > 0) {
            const modifierRows = buildOrderModifierInsertPayload({
              businessId: tenantContext.business.id,
              orderItemId: childOrderItem.id,
              modifiers: child.modifiers,
            })

            const { error: modifierError } = await supabaseAdmin
              .from("order_item_modifiers")
              .insert(modifierRows)

            if (modifierError) {
              throw new Error(
                `Could not create deal child modifiers: ${modifierError.message}`
              )
            }
          }
        }
      }

      continue
    }

    const configuredItem = item
    const { data: orderItem, error: orderItemError } = await supabaseAdmin
      .from("order_items")
      .insert(
        buildOrderItemInsertPayload({
          businessId: tenantContext.business.id,
          orderId: order.id,
          item: configuredItem,
        })
      )
      .select("id")
      .single()

    if (orderItemError || !orderItem) {
      throw new Error(`Could not create order item: ${orderItemError?.message}`)
    }

    orderItemIdsByLineId.set(configuredItem.cartItemId, orderItem.id)

    if (configuredItem.modifiers.length > 0) {
      const modifierRows = buildOrderModifierInsertPayload({
        businessId: tenantContext.business.id,
        orderItemId: orderItem.id,
        modifiers: configuredItem.modifiers,
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

  if (specialsPricing.appliedDiscounts.length > 0) {
    const discountRows = buildOrderDiscountInsertPayload({
      orderId: order.id,
      discounts: specialsPricing.appliedDiscounts,
      orderItemIdsByLineId,
    })

    const { error: discountError } = await supabaseAdmin
      .from("order_discounts")
      .insert(discountRows)

    if (discountError) {
      throw new Error(
        `Could not create order discount snapshots: ${discountError.message}`
      )
    }
  }

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number,
  }
}
