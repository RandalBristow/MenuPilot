import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  getRecentStaffOrders,
  getRecentStaffOrdersForScope,
  getStaffOrderScope,
} from "./get-orders"

const resolverMock = vi.hoisted(() => ({
  businessCalls: [] as unknown[],
  locationCalls: [] as unknown[],
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
}))

const supabaseMock = vi.hoisted(() => ({
  eqCalls: [] as { column: string; value: unknown }[],
  orders: [
    {
      id: "order-a",
      order_number: "MP-1",
      customer_name: "Jane",
      customer_phone: "555-1212",
      fulfillment_type: "pickup",
      order_status: "new",
      payment_status: "unpaid",
      total: "12.50",
      created_at: "2026-06-05T12:00:00.000Z",
      order_items: [],
    },
  ],
}))

vi.mock("@/features/tenant/queries/resolve-business-context", () => ({
  resolveBusinessContext: (input: unknown) => {
    resolverMock.businessCalls.push(input)
    return Promise.resolve(resolverMock.business)
  },
}))

vi.mock("@/features/tenant/queries/resolve-location-context", () => ({
  resolveLocationContext: (input: unknown) => {
    resolverMock.locationCalls.push(input)
    return Promise.resolve(resolverMock.location)
  },
}))

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: () => ({
      select() {
        const query = {
          eq(column: string, value: unknown) {
            supabaseMock.eqCalls.push({ column, value })
            return query
          },
          order() {
            return query
          },
          limit() {
            return Promise.resolve({
              data: supabaseMock.orders,
              error: null,
            })
          },
        }

        return query
      },
    }),
  },
}))

describe("staff order queries", () => {
  beforeEach(() => {
    resolverMock.businessCalls = []
    resolverMock.locationCalls = []
    supabaseMock.eqCalls = []
  })

  it("scopes staff order reads by supplied business and location ids", async () => {
    await getRecentStaffOrdersForScope({
      businessId: "business-a",
      locationId: "location-a",
    })

    expect(supabaseMock.eqCalls).toEqual([
      { column: "business_id", value: "business-a" },
      { column: "location_id", value: "location-a" },
    ])
  })

  it("does not query sibling locations when a location id is supplied", async () => {
    await getRecentStaffOrdersForScope({
      businessId: "business-a",
      locationId: "location-b",
    })

    expect(supabaseMock.eqCalls).toContainEqual({
      column: "location_id",
      value: "location-b",
    })
    expect(supabaseMock.eqCalls).not.toContainEqual({
      column: "location_id",
      value: "location-a",
    })
  })

  it("uses the legacy demo fallback when no staff scope is supplied", async () => {
    const scope = await getStaffOrderScope()

    expect(scope?.isLegacyDemo).toBe(true)
    expect(resolverMock.businessCalls[0]).toEqual({
      businessSlug: "pronto-demo",
    })
    expect(resolverMock.locationCalls[0]).toEqual({
      businessId: "business-a",
      locationSlug: "main-street",
    })
  })

  it("loads scoped staff orders through resolved tenant context", async () => {
    const orders = await getRecentStaffOrders({
      businessSlug: "business-a",
      locationSlug: "main",
    })

    expect(orders[0]).toMatchObject({
      orderNumber: "MP-1",
      total: 12.5,
    })
    expect(supabaseMock.eqCalls).toEqual([
      { column: "business_id", value: "business-a" },
      { column: "location_id", value: "location-a" },
    ])
  })
})
