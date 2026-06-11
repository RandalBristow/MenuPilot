import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  CustomerOrderNotFoundPage,
  CustomerOrderStatusPage,
} from "./CustomerOrderStatusPage"
import type { CustomerOrderStatus } from "@/features/order-status/types/customer-order"

function buildOrder(): CustomerOrderStatus {
  return {
    orderNumber: "MP-123",
    businessName: "Randy's Pizza & Pub",
    businessSlug: "randys-pizza",
    locationName: "Main St.",
    locationAddress: {
      line1: "123 Main St",
      line2: null,
      city: "Town",
      state: "PA",
      postalCode: "15000",
      phone: "555-1212",
      timezone: "America/New_York",
    },
    customerName: "Randy",
    fulfillmentType: "pickup",
    orderStatus: "preparing",
    placedAt: "2026-06-10T12:00:00.000Z",
    estimatedPrepMinutes: 20,
    estimatedReadyAt: null,
    subtotal: 31.98,
    discountTotal: 5,
    serviceFeeTotal: 1,
    taxTotal: 1.89,
    tipTotal: 3,
    total: 32.87,
    orderLevelDiscounts: [
      {
        name: "Family Night",
        discountType: "fixed_amount",
        discountValue: 5,
        amount: 5,
      },
    ],
    items: [
      {
        productName: "Family Deal",
        variantName: null,
        quantity: 1,
        unitPrice: 15.98,
        lineSubtotal: 15.98,
        relationshipType: "deal",
        specialType: "orderable_deal",
        componentLabel: null,
        componentPricingMode: null,
        componentBasePrice: null,
        modifiers: [],
        discounts: [],
        children: [
          {
            productName: "Deluxe Pizza",
            variantName: "Large",
            quantity: 1,
            unitPrice: 7.99,
            lineSubtotal: 7.99,
            relationshipType: "deal_component",
            specialType: "deal_component",
            componentLabel: "Pizza 1",
            componentPricingMode: "fixed_price",
            componentBasePrice: 7.99,
            modifiers: [
              {
                groupName: "Pizza Toppings",
                optionName: "Pepperoni",
                placement: "left",
                multiplier: 2,
                quantity: 1,
              },
            ],
            discounts: [],
            children: [],
          },
        ],
      },
      {
        productName: "Mix & Match Deal",
        variantName: null,
        quantity: 1,
        unitPrice: 10,
        lineSubtotal: 10,
        relationshipType: "deal",
        specialType: "mix_and_match_fixed_unit_price",
        componentLabel: null,
        componentPricingMode: null,
        componentBasePrice: null,
        modifiers: [],
        discounts: [],
        children: [
          {
            productName: "Pepsi",
            variantName: "2 Liter",
            quantity: 1,
            unitPrice: 3.49,
            lineSubtotal: 3.49,
            relationshipType: "mix_child",
            specialType: "mix_child",
            componentLabel: "Mix item",
            componentPricingMode: null,
            componentBasePrice: null,
            modifiers: [],
            discounts: [],
            children: [],
          },
        ],
      },
    ],
  }
}

describe("CustomerOrderStatusPage", () => {
  it("renders customer-safe order status, nested items, modifiers, discounts, and totals", () => {
    render(<CustomerOrderStatusPage order={buildOrder()} />)

    expect(screen.getByRole("heading", { name: "Order MP-123" })).toBeInTheDocument()
    expect(screen.getByText("Being prepared")).toBeInTheDocument()
    expect(screen.getByText("Your order is being prepared.")).toBeInTheDocument()
    expect(screen.getByText("Family Deal")).toBeInTheDocument()
    expect(screen.getAllByText("Deal").length).toBeGreaterThan(0)
    expect(screen.getByText("Deluxe Pizza")).toBeInTheDocument()
    expect(screen.getByText("Fixed price $7.99")).toBeInTheDocument()
    expect(screen.getByText(/Pepperoni/)).toHaveTextContent("left, x2")
    expect(screen.getByText("Mix & Match Deal")).toBeInTheDocument()
    expect(screen.getByText("Mix & Match")).toBeInTheDocument()
    expect(screen.getByText("Pepsi")).toBeInTheDocument()
    expect(screen.getByText(/Family Night/)).toHaveTextContent("$5.00 off")
    expect(screen.getAllByText("-$5.00").length).toBeGreaterThan(0)
    expect(screen.getByText("Service fee")).toBeInTheDocument()
    expect(screen.getByText("Tax")).toBeInTheDocument()
    expect(screen.getByText("Tip")).toBeInTheDocument()
    expect(screen.getAllByText("$32.87").length).toBeGreaterThan(0)
  })

  it("does not render internal UUIDs", () => {
    render(<CustomerOrderStatusPage order={buildOrder()} />)

    expect(screen.queryByText("parent-item-id")).not.toBeInTheDocument()
    expect(screen.queryByText("child-item-id")).not.toBeInTheDocument()
  })

  it("renders a friendly not found state", () => {
    render(<CustomerOrderNotFoundPage businessSlug="randys-pizza" />)

    expect(screen.getByText("We could not find that order.")).toBeInTheDocument()
    expect(
      screen.getByText("Check your order number or contact the restaurant.")
    ).toBeInTheDocument()
  })
})
