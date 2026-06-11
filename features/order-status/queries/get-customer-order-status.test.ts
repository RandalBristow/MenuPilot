import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCustomerOrderStatus } from "./get-customer-order-status"

const supabaseMock = vi.hoisted(() => ({
  eqCalls: [] as { column: string; value: unknown }[],
  order: null as unknown,
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
          maybeSingle() {
            return Promise.resolve({
              data: supabaseMock.order,
              error: null,
            })
          },
        }

        return query
      },
    }),
  },
}))

function buildRawOrder(overrides: Record<string, unknown> = {}) {
  return {
    order_number: "MP-123",
    customer_name: "Randy",
    fulfillment_type: "pickup",
    order_status: "new",
    subtotal: "29.98",
    discount_total: "5.00",
    tax_total: "1.50",
    tip_total: "2.00",
    charge_total: "1.00",
    total: "24.98",
    estimated_prep_minutes: 20,
    estimated_ready_at: null,
    created_at: "2026-06-10T12:00:00.000Z",
    businesses: {
      name: "Randy's Pizza & Pub",
      slug: "randys-pizza",
    },
    locations: {
      name: "Main St.",
      address_line1: "123 Main St",
      address_line2: null,
      city: "Town",
      state: "PA",
      postal_code: "15000",
      phone: "555-1212",
      timezone: "America/New_York",
    },
    order_discounts: [
      {
        order_item_id: null,
        name_snapshot: "Family Night",
        discount_type_snapshot: "fixed_amount",
        discount_value_snapshot: "5.00",
        amount: "5.00",
      },
    ],
    order_items: [
      {
        id: "parent-item-id",
        parent_order_item_id: null,
        relationship_type: "deal",
        product_name_snapshot: "Family Deal",
        variant_name_snapshot: null,
        quantity: 1,
        unit_price: "24.98",
        line_subtotal: "24.98",
        notes: JSON.stringify({ specialType: "orderable_deal" }),
        sort_order: 1,
        order_item_modifiers: [],
      },
      {
        id: "child-item-id",
        parent_order_item_id: "parent-item-id",
        relationship_type: "deal_component",
        product_name_snapshot: "Deluxe Pizza",
        variant_name_snapshot: "Large",
        quantity: 1,
        unit_price: "0",
        line_subtotal: "0",
        notes: JSON.stringify({
          componentLabel: "Pizza 1",
          componentPricingMode: "included",
          componentBasePrice: 0,
        }),
        sort_order: 2,
        order_item_modifiers: [
          {
            group_name_snapshot: "Pizza Toppings",
            option_name_snapshot: "Pepperoni",
            placement: "whole",
            multiplier: "1",
            quantity: "1",
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe("getCustomerOrderStatus", () => {
  beforeEach(() => {
    supabaseMock.eqCalls = []
    supabaseMock.order = buildRawOrder()
  })

  it("loads an order by business slug and order number", async () => {
    const order = await getCustomerOrderStatus({
      businessSlug: "randys-pizza",
      orderNumber: "MP-123",
    })

    expect(supabaseMock.eqCalls).toEqual([
      { column: "businesses.slug", value: "randys-pizza" },
      { column: "order_number", value: "MP-123" },
    ])
    expect(order).toMatchObject({
      orderNumber: "MP-123",
      businessName: "Randy's Pizza & Pub",
      orderStatus: "new",
      subtotal: 29.98,
      discountTotal: 5,
      serviceFeeTotal: 1,
      taxTotal: 1.5,
      tipTotal: 2,
      total: 24.98,
      orderLevelDiscounts: [{ name: "Family Night", amount: 5 }],
      items: [
        {
          productName: "Family Deal",
          specialType: "orderable_deal",
          children: [
            {
              productName: "Deluxe Pizza",
              componentLabel: "Pizza 1",
              modifiers: [
                {
                  groupName: "Pizza Toppings",
                  optionName: "Pepperoni",
                },
              ],
            },
          ],
        },
      ],
    })
  })

  it("returns null when a wrong-business order number is not found", async () => {
    supabaseMock.order = null

    const order = await getCustomerOrderStatus({
      businessSlug: "other-business",
      orderNumber: "MP-123",
    })

    expect(order).toBeNull()
  })

  it("reflects staff status changes on reload", async () => {
    supabaseMock.order = buildRawOrder({ order_status: "ready" })

    const order = await getCustomerOrderStatus({
      businessSlug: "randys-pizza",
      orderNumber: "MP-123",
    })

    expect(order?.orderStatus).toBe("ready")
  })
})
