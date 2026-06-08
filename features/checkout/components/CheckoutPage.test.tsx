import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock)

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
    clearCart: vi.fn(),
  }),
}))

vi.mock("@/features/checkout/actions/create-order", () => ({
  createOrder: vi.fn(),
}))

import { CheckoutPage } from "./CheckoutPage"

describe("CheckoutPage deal checkout", () => {
  it("shows orderable deal items without the old hard block", () => {
    render(<CheckoutPage />)

    expect(
      screen.queryByText("Orderable deals are not ready for checkout yet.")
    ).not.toBeInTheDocument()
    expect(screen.getByText("Family Deal")).toBeInTheDocument()
    expect(screen.getByText("Cheese Pizza")).toBeInTheDocument()
  })
})
