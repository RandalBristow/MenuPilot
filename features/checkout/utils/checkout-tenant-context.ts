import type { CartItem } from "@/features/cart/types/cart"
import type {
  TenantBusinessContext,
  TenantLocationContext,
} from "@/features/tenant/types/tenant-context"

export type CheckoutTenantContext = {
  business: TenantBusinessContext
  location: TenantLocationContext
  isLegacyDemo: boolean
}

export type CheckoutOrderabilityResult =
  | {
      ok: true
      reason: null
    }
  | {
      ok: false
      reason: string
    }

export function getCheckoutOrderability({
  business,
  location,
  fulfillmentType,
}: {
  business: TenantBusinessContext
  location: TenantLocationContext
  fulfillmentType?: "pickup" | "delivery"
}): CheckoutOrderabilityResult {
  if (!business.isActive) {
    return {
      ok: false,
      reason: "This business is not accepting orders yet.",
    }
  }

  if (!location.isActive) {
    return {
      ok: false,
      reason: "This location is not active yet.",
    }
  }

  if (!location.isEnabled) {
    return {
      ok: false,
      reason: "This location is not enabled for ordering.",
    }
  }

  if (!location.acceptingOrders) {
    return {
      ok: false,
      reason: "This location is not accepting orders right now.",
    }
  }

  if (fulfillmentType === "pickup" && !location.pickupEnabled) {
    return {
      ok: false,
      reason: "Pickup is not available for this location.",
    }
  }

  if (fulfillmentType === "delivery" && !location.deliveryEnabled) {
    return {
      ok: false,
      reason: "Delivery is not available for this location.",
    }
  }

  return {
    ok: true,
    reason: null,
  }
}

export function validateCartTenantContext({
  items,
  business,
  allowLegacyItems,
}: {
  items: CartItem[]
  business: TenantBusinessContext
  allowLegacyItems: boolean
}): CheckoutOrderabilityResult {
  const mismatchedItem = items.find((item) => {
    if (!item.businessId && !item.businessSlug) {
      return !allowLegacyItems
    }

    if (item.businessId && item.businessId !== business.id) return true
    if (item.businessSlug && item.businessSlug !== business.slug) return true

    return false
  })

  if (!mismatchedItem) {
    return {
      ok: true,
      reason: null,
    }
  }

  return {
    ok: false,
    reason:
      "Your cart contains items from another business. Please clear your cart and add items from this menu.",
  }
}
