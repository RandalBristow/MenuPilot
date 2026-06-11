import { describe, expect, it } from "vitest"
import { DEFAULT_BUSINESS_PRICING_SETTINGS } from "@/lib/pricing/business-pricing-settings"
import {
  calculateCheckoutTotals,
  calculateTipFromPercent,
} from "./calculate-checkout-totals"

describe("calculateCheckoutTotals", () => {
  it("preserves totals when tax, fees, and tips are disabled", () => {
    expect(
      calculateCheckoutTotals({
        subtotal: 20,
        settings: DEFAULT_BUSINESS_PRICING_SETTINGS,
      })
    ).toMatchObject({
      subtotal: 20,
      discountTotal: 0,
      serviceFeeTotal: 0,
      taxTotal: 0,
      tipTotal: 0,
      total: 20,
    })
  })

  it("calculates tax after discounts", () => {
    expect(
      calculateCheckoutTotals({
        subtotal: 20,
        discountTotal: 5,
        settings: {
          ...DEFAULT_BUSINESS_PRICING_SETTINGS,
          salesTaxRatePercent: 10,
        },
      })
    ).toMatchObject({
      discountedSubtotal: 15,
      taxTotal: 1.5,
      total: 16.5,
    })
  })

  it("supports fixed and percentage service fees", () => {
    expect(
      calculateCheckoutTotals({
        subtotal: 20,
        settings: {
          ...DEFAULT_BUSINESS_PRICING_SETTINGS,
          serviceFeeType: "fixed",
          serviceFeeValue: 2,
        },
      }).serviceFeeTotal
    ).toBe(2)

    expect(
      calculateCheckoutTotals({
        subtotal: 20,
        settings: {
          ...DEFAULT_BUSINESS_PRICING_SETTINGS,
          serviceFeeType: "percentage",
          serviceFeeValue: 5,
        },
      }).serviceFeeTotal
    ).toBe(1)
  })

  it("adds tips after tax and fees", () => {
    const result = calculateCheckoutTotals({
      subtotal: 20,
      tipTotal: 3,
      settings: {
        ...DEFAULT_BUSINESS_PRICING_SETTINGS,
        salesTaxRatePercent: 10,
        serviceFeeType: "fixed",
        serviceFeeValue: 2,
      },
    })

    expect(result).toMatchObject({
      serviceFeeTotal: 2,
      taxTotal: 2,
      tipTotal: 3,
      total: 27,
    })
  })

  it("rounds cents consistently", () => {
    expect(
      calculateCheckoutTotals({
        subtotal: 10.01,
        settings: {
          ...DEFAULT_BUSINESS_PRICING_SETTINGS,
          salesTaxRatePercent: 7.25,
        },
      }).taxTotal
    ).toBe(0.73)
  })
})

describe("calculateTipFromPercent", () => {
  it("calculates preset tip amounts from the discounted subtotal basis", () => {
    expect(calculateTipFromPercent({ basis: 15, percent: 20 })).toBe(3)
  })
})
