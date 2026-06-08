import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { ConfiguredCartItem } from "@/features/cart/types/cart"
import { CheckoutOrderSummary } from "./CheckoutOrderSummary"

const items: ConfiguredCartItem[] = [
  {
    cartItemId: "cart-item-a",
    productId: "product-a",
    productName: "Deluxe Pizza",
    variantId: null,
    variantName: null,
    quantity: 1,
    unitPrice: 12.95,
    totalPrice: 12.95,
    modifiers: [],
  },
]

describe("CheckoutOrderSummary", () => {
  it("shows that eligible specials are calculated when the order is placed", () => {
    render(<CheckoutOrderSummary items={items} subtotal={12.95} />)

    expect(
      screen.getByText(
        "Eligible specials are calculated when you place the order."
      )
    ).toBeInTheDocument()
    expect(screen.getByText("Subtotal")).toBeInTheDocument()
    expect(screen.queryByText(/Discounts:/i)).not.toBeInTheDocument()
  })
})
