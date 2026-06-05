import { describe, expect, it } from "vitest"
import type { CartItem } from "@/features/cart/types/cart"
import type {
  TenantBusinessContext,
  TenantLocationContext,
} from "@/features/tenant/types/tenant-context"
import {
  getCheckoutOrderability,
  validateCartTenantContext,
} from "./checkout-tenant-context"

function buildBusiness(
  overrides: Partial<TenantBusinessContext> = {}
): TenantBusinessContext {
  return {
    id: "business-a",
    slug: "business-a",
    name: "Business A",
    status: "active",
    primaryContactName: null,
    primaryContactEmail: null,
    primaryPhone: null,
    isActive: true,
    isSetup: false,
    isPaused: false,
    isArchived: false,
    ...overrides,
  }
}

function buildLocation(
  overrides: Partial<TenantLocationContext> = {}
): TenantLocationContext {
  return {
    id: "location-a",
    businessId: "business-a",
    slug: "main",
    name: "Main",
    status: "active",
    isEnabled: true,
    acceptingOrders: true,
    pickupEnabled: true,
    deliveryEnabled: false,
    timezone: "America/New_York",
    isActive: true,
    isSetup: false,
    ...overrides,
  }
}

function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    cartItemId: "cart-1",
    businessId: "business-a",
    businessSlug: "business-a",
    productId: "product-a",
    productName: "Pizza",
    variantId: null,
    variantName: null,
    quantity: 1,
    unitPrice: 12,
    totalPrice: 12,
    modifiers: [],
    ...overrides,
  }
}

describe("checkout tenant context", () => {
  it("allows active businesses and orderable pickup locations", () => {
    expect(
      getCheckoutOrderability({
        business: buildBusiness(),
        location: buildLocation(),
        fulfillmentType: "pickup",
      })
    ).toEqual({ ok: true, reason: null })
  })

  it("allows activated location settings to make pickup checkout orderable", () => {
    const result = getCheckoutOrderability({
      business: buildBusiness({
        status: "active",
        isActive: true,
        isSetup: false,
      }),
      location: buildLocation({
        status: "active",
        isActive: true,
        isEnabled: true,
        acceptingOrders: true,
        pickupEnabled: true,
        deliveryEnabled: false,
      }),
      fulfillmentType: "pickup",
    })

    expect(result).toEqual({ ok: true, reason: null })
  })

  it("blocks setup businesses", () => {
    const result = getCheckoutOrderability({
      business: buildBusiness({
        status: "setup",
        isActive: false,
        isSetup: true,
      }),
      location: buildLocation(),
    })

    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/not accepting orders/i)
  })

  it("blocks paused businesses and paused locations", () => {
    expect(
      getCheckoutOrderability({
        business: buildBusiness({
          status: "paused",
          isActive: false,
          isPaused: true,
        }),
        location: buildLocation(),
      }).ok
    ).toBe(false)
    expect(
      getCheckoutOrderability({
        business: buildBusiness(),
        location: buildLocation({
          status: "paused",
          isActive: false,
        }),
      }).ok
    ).toBe(false)
  })

  it("blocks inactive, disabled, and non-ordering locations", () => {
    expect(
      getCheckoutOrderability({
        business: buildBusiness(),
        location: buildLocation({ status: "setup", isActive: false }),
      }).ok
    ).toBe(false)
    expect(
      getCheckoutOrderability({
        business: buildBusiness(),
        location: buildLocation({ isEnabled: false }),
      }).ok
    ).toBe(false)
    expect(
      getCheckoutOrderability({
        business: buildBusiness(),
        location: buildLocation({ acceptingOrders: false }),
      }).ok
    ).toBe(false)
  })

  it("blocks unavailable fulfillment types", () => {
    const result = getCheckoutOrderability({
      business: buildBusiness(),
      location: buildLocation({ deliveryEnabled: false }),
      fulfillmentType: "delivery",
    })

    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/delivery/i)
  })

  it("allows legacy cart items only on legacy checkout", () => {
    expect(
      validateCartTenantContext({
        items: [buildCartItem({ businessId: undefined, businessSlug: undefined })],
        business: buildBusiness(),
        allowLegacyItems: true,
      }).ok
    ).toBe(true)
    expect(
      validateCartTenantContext({
        items: [buildCartItem({ businessId: undefined, businessSlug: undefined })],
        business: buildBusiness(),
        allowLegacyItems: false,
      }).ok
    ).toBe(false)
  })

  it("rejects cart items from another business", () => {
    const result = validateCartTenantContext({
      items: [buildCartItem({ businessId: "business-b" })],
      business: buildBusiness(),
      allowLegacyItems: false,
    })

    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/another business/i)
  })
})
