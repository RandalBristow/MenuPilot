import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_BUSINESS_PRICING_SETTINGS } from "@/lib/pricing/business-pricing-settings"

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock)

const cartMock = vi.hoisted(() => ({
  clearCart: vi.fn(),
}))

const checkoutActionMock = vi.hoisted(() => ({
  createOrder: vi.fn(),
}))

vi.mock("@/features/cart/context/CartProvider", () => ({
  useCart: () => ({
    items: [
      {
        cartItemId: "deal-cart-1",
        itemType: "deal",
        specialId: "deal-1",
        specialName: "Family Deal",
        dealBasePrice: 24.99,
        childExtraTotal: 0,
        totalPrice: 24.99,
        components: [
          {
            componentId: "component-1",
            componentLabel: "Choose a pizza",
            sortOrder: 1,
            requiredQuantity: 1,
            selectedQuantity: 1,
            children: [
              {
                childLineId: "child-1",
                productId: "product-1",
                productName: "Cheese Pizza",
                variantId: null,
                variantName: null,
                quantity: 1,
                configuredLineTotal: 12,
                childExtraTotal: 0,
                modifiers: [],
              },
            ],
          },
        ],
      },
    ],
    clearCart: cartMock.clearCart,
  }),
}))

vi.mock("@/features/checkout/actions/create-order", () => ({
  createOrder: checkoutActionMock.createOrder,
}))

import { CheckoutPage } from "./CheckoutPage"

describe("CheckoutPage deal checkout", () => {
  beforeEach(() => {
    cartMock.clearCart.mockClear()
    checkoutActionMock.createOrder.mockReset()
  })

  it("shows orderable deal items without the old hard block", () => {
    render(<CheckoutPage />)

    expect(
      screen.queryByText("Orderable deals are not ready for checkout yet.")
    ).not.toBeInTheDocument()
    expect(screen.getByText("Family Deal")).toBeInTheDocument()
    expect(screen.getByText("Cheese Pizza")).toBeInTheDocument()
  })

  it("links to the tenant-scoped order status page after checkout succeeds", async () => {
    checkoutActionMock.createOrder.mockResolvedValue({
      ok: true,
      orderId: "internal-order-id",
      orderNumber: "MP-123",
    })

    render(
      <CheckoutPage
        businessSlug="randys-pizza"
        businessName="Randy's Pizza & Pub"
      />
    )

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Randy" },
    })
    fireEvent.change(screen.getByLabelText("Phone"), {
      target: { value: "555-1212" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Place Order" }))

    await waitFor(() => {
      expect(screen.getByText("Order placed!")).toBeInTheDocument()
    })

    const statusLink = screen.getByRole("link", {
      name: "View order status",
    })

    expect(screen.getByText("MP-123")).toBeInTheDocument()
    expect(statusLink).toHaveAttribute(
      "href",
      "/businesses/randys-pizza/orders/MP-123"
    )
    expect(statusLink).not.toHaveAttribute(
      "href",
      expect.stringContaining("internal-order-id")
    )
    expect(screen.queryByText("internal-order-id")).not.toBeInTheDocument()
    expect(cartMock.clearCart).toHaveBeenCalled()
  })

  it("does not render a broken order status link when tenant slug is missing", async () => {
    checkoutActionMock.createOrder.mockResolvedValue({
      ok: true,
      orderId: "internal-order-id",
      orderNumber: "MP-456",
    })

    render(<CheckoutPage />)

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Randy" },
    })
    fireEvent.change(screen.getByLabelText("Phone"), {
      target: { value: "555-1212" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Place Order" }))

    await waitFor(() => {
      expect(screen.getByText("Order placed!")).toBeInTheDocument()
    })

    expect(screen.getByText("MP-456")).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "View order status" })
    ).not.toBeInTheDocument()
    expect(screen.queryByText("internal-order-id")).not.toBeInTheDocument()
    expect(cartMock.clearCart).toHaveBeenCalled()
  })

  it("passes the selected tip amount to order creation", async () => {
    checkoutActionMock.createOrder.mockResolvedValue({
      ok: true,
      orderId: "internal-order-id",
      orderNumber: "MP-789",
    })

    render(
      <CheckoutPage
        businessSlug="randys-pizza"
        pricingSettings={{
          ...DEFAULT_BUSINESS_PRICING_SETTINGS,
          tipsEnabled: true,
        }}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "20%" }))
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Randy" },
    })
    fireEvent.change(screen.getByLabelText("Phone"), {
      target: { value: "555-1212" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Place Order" }))

    await waitFor(() => {
      expect(checkoutActionMock.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          tipAmount: 5,
        })
      )
    })
  })
})
