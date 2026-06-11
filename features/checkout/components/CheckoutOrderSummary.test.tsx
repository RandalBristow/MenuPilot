import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { ConfiguredCartItem } from "@/features/cart/types/cart"
import { DEFAULT_BUSINESS_PRICING_SETTINGS } from "@/lib/pricing/business-pricing-settings"
import { calculateCheckoutTotals } from "@/features/checkout/utils/calculate-checkout-totals"
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
    const totals = calculateCheckoutTotals({
      subtotal: 12.95,
      settings: DEFAULT_BUSINESS_PRICING_SETTINGS,
    })

    render(
      <CheckoutOrderSummary
        items={items}
        subtotal={12.95}
        totals={totals}
        pricingSettings={DEFAULT_BUSINESS_PRICING_SETTINGS}
        tipAmount={0}
        onTipAmountChange={() => {}}
      />
    )

    expect(
      screen.getByText(
        "Eligible specials are calculated when you place the order."
      )
    ).toBeInTheDocument()
    expect(screen.getByText("Subtotal")).toBeInTheDocument()
    expect(screen.getByText("Total")).toBeInTheDocument()
    expect(screen.queryByText(/Discounts:/i)).not.toBeInTheDocument()
  })

  it("shows tax, service fee, and tip rows when configured", () => {
    const settings = {
      ...DEFAULT_BUSINESS_PRICING_SETTINGS,
      salesTaxRatePercent: 10,
      serviceFeeType: "fixed" as const,
      serviceFeeValue: 2,
      tipsEnabled: true,
    }
    const totals = calculateCheckoutTotals({
      subtotal: 12.95,
      settings,
      tipTotal: 1.3,
    })

    render(
      <CheckoutOrderSummary
        items={items}
        subtotal={12.95}
        totals={totals}
        pricingSettings={settings}
        tipAmount={1.3}
        onTipAmountChange={() => {}}
      />
    )

    expect(screen.getByText("Service fee")).toBeInTheDocument()
    expect(screen.getByText("Tax")).toBeInTheDocument()
    expect(screen.getAllByText("Tip").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "No tip" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "10%" })).toBeInTheDocument()
  })
})
