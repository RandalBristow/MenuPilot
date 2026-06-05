import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CartItem } from "@/features/cart/types/cart"
import type { CheckoutTenantContext } from "@/features/checkout/utils/checkout-tenant-context"
import { createOrder } from "./create-order"

const resolverMock = vi.hoisted(() => ({
  context: null as CheckoutTenantContext | null,
  calls: [] as unknown[],
}))

const checkoutProductMock = vi.hoisted(() => ({
  products: [
    {
      id: "product-a",
      name: "Server Pizza",
      isEnabled: true,
      basePrice: 12,
    },
  ],
  calls: [] as unknown[],
}))

const supabaseMock = vi.hoisted(() => ({
  inserts: [] as { table: string; payload: unknown }[],
}))

vi.mock("@/features/checkout/utils/resolve-checkout-tenant-context", () => ({
  resolveCheckoutTenantContext: (input: unknown) => {
    resolverMock.calls.push(input)
    return Promise.resolve(resolverMock.context)
  },
}))

vi.mock("@/features/checkout/queries/load-checkout-product-config", () => ({
  loadCheckoutProductConfig: (input: unknown) => {
    checkoutProductMock.calls.push(input)
    return Promise.resolve(checkoutProductMock.products)
  },
}))

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: (table: string) => ({
      insert(payload: unknown) {
        supabaseMock.inserts.push({ table, payload })

        return {
          select() {
            return {
              single() {
                if (table === "orders") {
                  return Promise.resolve({
                    data: {
                      id: "order-a",
                      order_number: "MP-123",
                    },
                    error: null,
                  })
                }

                return Promise.resolve({
                  data: {
                    id: "order-item-a",
                  },
                  error: null,
                })
              },
            }
          },
          then(resolve: (value: { error: null }) => void) {
            resolve({ error: null })
          },
        }
      },
    }),
  },
}))

function buildTenantContext(
  overrides: Partial<CheckoutTenantContext> = {}
): CheckoutTenantContext {
  return {
    isLegacyDemo: false,
    business: {
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
    },
    location: {
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
    },
    ...overrides,
  }
}

function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    cartItemId: "cart-a",
    businessId: "business-a",
    businessSlug: "business-a",
    productId: "product-a",
    productName: "Client Pizza",
    variantId: null,
    variantName: null,
    quantity: 1,
    unitPrice: 1,
    totalPrice: 1,
    modifiers: [],
    ...overrides,
  }
}

function buildInput(overrides: Partial<Parameters<typeof createOrder>[0]> = {}) {
  return {
    customerName: "Jane",
    customerPhone: "555-1212",
    fulfillmentType: "pickup" as const,
    items: [buildCartItem()],
    businessSlug: "business-a",
    ...overrides,
  }
}

describe("createOrder tenant checkout", () => {
  beforeEach(() => {
    resolverMock.context = buildTenantContext()
    resolverMock.calls = []
    checkoutProductMock.products = [
      {
        id: "product-a",
        name: "Server Pizza",
        isEnabled: true,
        basePrice: 12,
      },
    ]
    checkoutProductMock.calls = []
    supabaseMock.inserts = []
  })

  it("passes supplied business slug to tenant resolution", async () => {
    await createOrder(buildInput({ businessSlug: "business-a" }))

    expect(resolverMock.calls[0]).toEqual({
      businessSlug: "business-a",
      locationSlug: undefined,
    })
  })

  it("uses legacy demo fallback when no business slug is supplied", async () => {
    resolverMock.context = buildTenantContext({ isLegacyDemo: true })

    await createOrder(
      buildInput({
        businessSlug: undefined,
        items: [buildCartItem({ businessId: undefined, businessSlug: undefined })],
      })
    )

    expect(resolverMock.calls[0]).toEqual({
      businessSlug: undefined,
      locationSlug: undefined,
    })
  })

  it("blocks setup businesses before inserting an order", async () => {
    resolverMock.context = buildTenantContext({
      business: {
        ...buildTenantContext().business,
        status: "setup",
        isActive: false,
        isSetup: true,
      },
    })

    const result = await createOrder(buildInput())

    expect(result.ok).toBe(false)
    expect(supabaseMock.inserts).toHaveLength(0)
  })

  it("rejects cross-tenant carts before inserting an order", async () => {
    const result = await createOrder(
      buildInput({ items: [buildCartItem({ businessId: "business-b" })] })
    )

    expect(result.ok).toBe(false)
    expect(result.ok ? "" : result.error).toMatch(/another business/i)
    expect(supabaseMock.inserts).toHaveLength(0)
  })

  it("loads product config with selected business id and inserts resolved ids", async () => {
    const result = await createOrder(buildInput())

    expect(result).toMatchObject({
      ok: true,
      orderId: "order-a",
      orderNumber: "MP-123",
    })
    expect(checkoutProductMock.calls[0]).toEqual({
      businessId: "business-a",
      productIds: ["product-a"],
    })
    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        business_id: "business-a",
        location_id: "location-a",
        subtotal: 12,
        total: 12,
      },
    })
  })
})
