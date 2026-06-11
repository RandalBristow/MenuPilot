import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { StaffOrder } from "@/features/staff-orders/types/staff-order"
import { StaffOrdersPage } from "./StaffOrdersPage"

const ordersMock = vi.hoisted(() => ({
  orders: [] as StaffOrder[],
  calls: [] as unknown[],
}))

vi.mock("@/features/staff-orders/queries/get-orders", () => ({
  getRecentStaffOrders: (input: unknown) => {
    ordersMock.calls.push(input)
    return Promise.resolve(ordersMock.orders)
  },
}))

vi.mock("@/features/staff-orders/actions/update-order-status", () => ({
  updateOrderStatus: vi.fn(),
}))

function buildOrder(overrides: Partial<StaffOrder> = {}): StaffOrder {
  return {
    id: "order-a",
    orderNumber: "MP-1",
    customerName: "Jane",
    customerPhone: "555-1212",
    fulfillmentType: "pickup",
    orderStatus: "new",
    paymentStatus: "unpaid",
    subtotal: 29.98,
    discountTotal: 0,
    serviceFeeTotal: 0,
    taxTotal: 0,
    tipTotal: 0,
    total: 29.98,
    createdAt: "2026-06-05T12:00:00.000Z",
    discounts: [],
    orderLevelDiscounts: [],
    items: [
      {
        id: "order-item-a",
        parentOrderItemId: null,
        relationshipType: null,
        specialType: null,
        componentLabel: null,
        componentPricingMode: null,
        componentFixedPrice: null,
        componentBasePrice: null,
        childExtraTotal: null,
        productName: "Large Pizza",
        variantName: '16"',
        quantity: 1,
        unitPrice: 29.98,
        lineSubtotal: 29.98,
        modifiers: [],
        discounts: [],
        children: [],
      },
    ],
    ...overrides,
  }
}

describe("StaffOrdersPage discount display", () => {
  beforeEach(() => {
    ordersMock.orders = []
    ordersMock.calls = []
  })

  it("renders no discount section for orders without discounts", async () => {
    ordersMock.orders = [buildOrder()]

    render(await StaffOrdersPage())

    expect(screen.getByText("MP-1")).toBeInTheDocument()
    expect(screen.queryByText("Applied discounts")).not.toBeInTheDocument()
    expect(screen.queryByText("Subtotal")).not.toBeInTheDocument()
    expect(screen.queryByText("Discounts")).not.toBeInTheDocument()
  })

  it("renders cart-level discount section and subtotal breakdown", async () => {
    ordersMock.orders = [
      buildOrder({
        discountTotal: 5,
        total: 24.98,
        discounts: [
          {
            id: "discount-a",
            orderId: "order-a",
            orderItemId: null,
            specialId: "special-a",
            nameSnapshot: "Family Night",
            specialTypeSnapshot: "cart_discount",
            discountTypeSnapshot: "fixed_amount",
            discountValueSnapshot: 5,
            amount: 5,
            couponCodeSnapshot: null,
            createdAt: "2026-06-05T12:01:00.000Z",
          },
        ],
        orderLevelDiscounts: [
          {
            id: "discount-a",
            orderId: "order-a",
            orderItemId: null,
            specialId: "special-a",
            nameSnapshot: "Family Night",
            specialTypeSnapshot: "cart_discount",
            discountTypeSnapshot: "fixed_amount",
            discountValueSnapshot: 5,
            amount: 5,
            couponCodeSnapshot: null,
            createdAt: "2026-06-05T12:01:00.000Z",
          },
        ],
      }),
    ]

    render(await StaffOrdersPage())

    expect(screen.getByText("Applied discounts")).toBeInTheDocument()
    expect(screen.getByText("Family Night")).toBeInTheDocument()
    expect(screen.getByText("Subtotal")).toBeInTheDocument()
    expect(screen.getAllByText("$29.98").length).toBeGreaterThan(0)
    expect(screen.getByText("Discounts")).toBeInTheDocument()
    expect(screen.getAllByText("-$5.00").length).toBeGreaterThan(0)
    expect(screen.getAllByText("$24.98").length).toBeGreaterThan(0)
  })

  it("renders service fee, tax, and tip rows when present", async () => {
    ordersMock.orders = [
      buildOrder({
        serviceFeeTotal: 1,
        taxTotal: 2,
        tipTotal: 3,
        total: 35.98,
      }),
    ]

    render(await StaffOrdersPage())

    expect(screen.getByText("Service fee")).toBeInTheDocument()
    expect(screen.getByText("Tax")).toBeInTheDocument()
    expect(screen.getByText("Tip")).toBeInTheDocument()
    expect(screen.getAllByText("$35.98").length).toBeGreaterThan(0)
  })

  it("renders line-level discount under the affected item", async () => {
    ordersMock.orders = [
      buildOrder({
        discountTotal: 3,
        total: 26.98,
        discounts: [
          {
            id: "discount-line",
            orderId: "order-a",
            orderItemId: "order-item-a",
            specialId: "special-line",
            nameSnapshot: "Pizza Deal",
            specialTypeSnapshot: "line_discount",
            discountTypeSnapshot: "percentage",
            discountValueSnapshot: 10,
            amount: 3,
            couponCodeSnapshot: null,
            createdAt: "2026-06-05T12:01:00.000Z",
          },
        ],
        orderLevelDiscounts: [],
        items: [
          {
            id: "order-item-a",
            parentOrderItemId: null,
            relationshipType: null,
            specialType: null,
            componentLabel: null,
            componentPricingMode: null,
            componentFixedPrice: null,
            componentBasePrice: null,
            childExtraTotal: null,
            productName: "Large Pizza",
            variantName: '16"',
            quantity: 1,
            unitPrice: 29.98,
            lineSubtotal: 29.98,
            modifiers: [],
            discounts: [
              {
                id: "discount-line",
                orderId: "order-a",
                orderItemId: "order-item-a",
                specialId: "special-line",
                nameSnapshot: "Pizza Deal",
                specialTypeSnapshot: "line_discount",
                discountTypeSnapshot: "percentage",
                discountValueSnapshot: 10,
                amount: 3,
                couponCodeSnapshot: null,
                createdAt: "2026-06-05T12:01:00.000Z",
              },
            ],
            children: [],
          },
        ],
      }),
    ]

    render(await StaffOrdersPage())

    expect(screen.queryByText("Applied discounts")).not.toBeInTheDocument()
    expect(screen.getByText(/Pizza Deal 10% off/)).toBeInTheDocument()
    expect(screen.getAllByText("-$3.00").length).toBeGreaterThan(0)
    expect(screen.getByText("Subtotal")).toBeInTheDocument()
    expect(screen.getByText("Discounts")).toBeInTheDocument()
  })

  it("renders orderable deal child component pricing copy", async () => {
    ordersMock.orders = [
      buildOrder({
        total: 15.98,
        items: [
          {
            id: "deal-parent",
            parentOrderItemId: null,
            relationshipType: "deal",
            specialType: "orderable_deal",
            componentLabel: null,
            componentPricingMode: null,
            componentFixedPrice: null,
            componentBasePrice: null,
            childExtraTotal: null,
            productName: "Two Large Pizzas Deal",
            variantName: null,
            quantity: 1,
            unitPrice: 15.98,
            lineSubtotal: 15.98,
            modifiers: [],
            discounts: [],
            children: [
              {
                id: "deal-child-a",
                parentOrderItemId: "deal-parent",
                relationshipType: "deal_component",
                specialType: "deal_component",
                componentLabel: "Pizza 1",
                componentPricingMode: "fixed_price",
                componentFixedPrice: 7.99,
                componentBasePrice: 7.99,
                childExtraTotal: 0,
                productName: "Build Your Own Pizza",
                variantName: "Large",
                quantity: 1,
                unitPrice: 0,
                lineSubtotal: 0,
                modifiers: [],
                discounts: [],
                children: [],
              },
              {
                id: "deal-child-b",
                parentOrderItemId: "deal-parent",
                relationshipType: "deal_component",
                specialType: "deal_component",
                componentLabel: "2-liter",
                componentPricingMode: "included",
                componentFixedPrice: null,
                componentBasePrice: 0,
                childExtraTotal: 0,
                productName: "Pepsi",
                variantName: "2 Liter",
                quantity: 1,
                unitPrice: 0,
                lineSubtotal: 0,
                modifiers: [],
                discounts: [],
                children: [],
              },
            ],
          },
        ],
      }),
    ]

    render(await StaffOrdersPage())

    expect(screen.getByText("Two Large Pizzas Deal")).toBeInTheDocument()
    expect(screen.getByText("Fixed price $7.99")).toBeInTheDocument()
    expect(screen.getByText("Included")).toBeInTheDocument()
  })
})
