import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  getRecentStaffOrders,
  getRecentStaffOrdersForScope,
  getStaffOrderScope,
} from "./get-orders"

type TestRawOrder = {
  id: string
  order_number: string
  customer_name: string | null
  customer_phone: string | null
  fulfillment_type: string
  order_status: string
  payment_status: string
  subtotal: number | string
  discount_total: number | string
  total: number | string
  created_at: string
  order_items: Array<{
    id: string
    product_name_snapshot: string
    variant_name_snapshot: string | null
    quantity: number
    unit_price: number | string
    line_subtotal: number | string
    sort_order: number
    order_item_modifiers: unknown[]
  }>
  order_discounts: Array<{
    id: string
    order_id: string
    order_item_id: string | null
    special_id: string | null
    name_snapshot: string
    special_type_snapshot: string
    discount_type_snapshot: string
    discount_value_snapshot: number | string
    amount: number | string
    coupon_code_snapshot: string | null
    created_at: string
  }>
}

function buildDefaultOrders(): TestRawOrder[] {
  return [
    {
      id: "order-a",
      order_number: "MP-1",
      customer_name: "Jane",
      customer_phone: "555-1212",
      fulfillment_type: "pickup",
      order_status: "new",
      payment_status: "unpaid",
      subtotal: "12.50",
      discount_total: "0",
      total: "12.50",
      created_at: "2026-06-05T12:00:00.000Z",
      order_items: [],
      order_discounts: [],
    },
  ]
}

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
  orders: buildDefaultOrders(),
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
    supabaseMock.orders = buildDefaultOrders()
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
      subtotal: 12.5,
      discountTotal: 0,
      total: 12.5,
      discounts: [],
      orderLevelDiscounts: [],
    })
    expect(supabaseMock.eqCalls).toEqual([
      { column: "business_id", value: "business-a" },
      { column: "location_id", value: "location-a" },
    ])
  })

  it("maps order discount snapshots and item-level discounts", async () => {
    supabaseMock.orders = [
      {
        id: "order-b",
        order_number: "MP-2",
        customer_name: "Randy",
        customer_phone: "555-0100",
        fulfillment_type: "pickup",
        order_status: "new",
        payment_status: "unpaid",
        subtotal: "29.98",
        discount_total: "5.00",
        total: "24.98",
        created_at: "2026-06-05T12:00:00.000Z",
        order_items: [
          {
            id: "order-item-a",
            product_name_snapshot: "Large Pizza",
            variant_name_snapshot: '16"',
            quantity: 1,
            unit_price: "29.98",
            line_subtotal: "29.98",
            sort_order: 1,
            order_item_modifiers: [],
          },
        ],
        order_discounts: [
          {
            id: "discount-a",
            order_id: "order-b",
            order_item_id: "order-item-a",
            special_id: "special-a",
            name_snapshot: "Family Night",
            special_type_snapshot: "line_discount",
            discount_type_snapshot: "fixed_amount",
            discount_value_snapshot: "5.00",
            amount: "5.00",
            coupon_code_snapshot: null,
            created_at: "2026-06-05T12:01:00.000Z",
          },
        ],
      },
    ]

    const orders = await getRecentStaffOrdersForScope({
      businessId: "business-a",
      locationId: "location-a",
    })

    expect(orders[0]).toMatchObject({
      subtotal: 29.98,
      discountTotal: 5,
      total: 24.98,
      discounts: [
        {
          id: "discount-a",
          orderId: "order-b",
          orderItemId: "order-item-a",
          specialId: "special-a",
          nameSnapshot: "Family Night",
          specialTypeSnapshot: "line_discount",
          discountTypeSnapshot: "fixed_amount",
          discountValueSnapshot: 5,
          amount: 5,
          couponCodeSnapshot: null,
        },
      ],
      orderLevelDiscounts: [],
    })
    expect(orders[0].items[0].discounts).toHaveLength(1)
  })

  it("keeps discount reads scoped to selected business and location orders", async () => {
    await getRecentStaffOrdersForScope({
      businessId: "business-a",
      locationId: "location-a",
    })

    expect(supabaseMock.eqCalls).toEqual([
      { column: "business_id", value: "business-a" },
      { column: "location_id", value: "location-a" },
    ])
  })
})
