import { describe, expect, it } from "vitest"
import {
  applySpecialsToPricedCart,
  type ApplySpecialsToPricedCartInput,
  type SpecialsPricedCartLine,
} from "./apply-specials-to-priced-cart"
import type { SpecialCandidate } from "@/features/specials/types/special"

const businessId = "business-1"
const now = "2026-06-06T12:00:00.000Z"

const pizzaLine: SpecialsPricedCartLine = {
  lineId: "line-pizza",
  orderItemId: "order-item-pizza",
  productId: "pizza",
  menuGroupId: "pizza-category",
  variantGroupOptionId: "large",
  quantity: 2,
  lineSubtotal: 40,
  productNameSnapshot: "Large Pizza",
}

const saladLine: SpecialsPricedCartLine = {
  lineId: "line-salad",
  productId: "salad",
  menuGroupIds: ["salads", "lunch"],
  variantGroupOptionId: "regular",
  quantity: 1,
  lineSubtotal: 12,
  productNameSnapshot: "Chicken Salad",
}

function lineDiscount(
  overrides: Partial<SpecialCandidate> = {}
): SpecialCandidate {
  return {
    id: "special-line",
    businessId,
    name: "Line Discount",
    specialType: "line_discount",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    isEnabled: true,
    eligibleProducts: [{ productId: "pizza" }],
    eligibleMenuGroupIds: [],
    ...overrides,
  }
}

function fixedPriceLine(
  overrides: Partial<SpecialCandidate> = {}
): SpecialCandidate {
  return {
    id: "special-fixed-price",
    businessId,
    name: "Fixed Price Pizza",
    specialType: "fixed_price_line",
    discountType: "fixed_price",
    discountValue: 15,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    isEnabled: true,
    eligibleProducts: [{ productId: "pizza" }],
    eligibleMenuGroupIds: [],
    ...overrides,
  }
}

function cartDiscount(
  overrides: Partial<SpecialCandidate> = {}
): SpecialCandidate {
  return {
    id: "special-cart",
    businessId,
    name: "Cart Discount",
    specialType: "cart_discount",
    discountType: "fixed_amount",
    discountValue: 5,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    isEnabled: true,
    eligibleProducts: [],
    eligibleMenuGroupIds: [],
    ...overrides,
  }
}

function apply(
  overrides: Partial<ApplySpecialsToPricedCartInput> = {}
) {
  return applySpecialsToPricedCart({
    businessId,
    currentTime: now,
    lines: [pizzaLine, saladLine],
    specials: [lineDiscount()],
    ...overrides,
  })
}

describe("applySpecialsToPricedCart", () => {
  it("returns zero totals for an empty cart", () => {
    expect(
      apply({
        lines: [],
        specials: [lineDiscount()],
      })
    ).toEqual({
      subtotal: 0,
      discountTotal: 0,
      total: 0,
      appliedSpecialId: null,
      appliedDiscounts: [],
      lineTotals: [],
    })
  })

  it("returns subtotal when no specials are provided", () => {
    const result = apply({ specials: [] })

    expect(result.discountTotal).toBe(0)
    expect(result.total).toBe(52)
    expect(result.appliedSpecialId).toBeNull()
  })

  it("ignores disabled specials", () => {
    const result = apply({
      specials: [lineDiscount({ isEnabled: false })],
    })

    expect(result.discountTotal).toBe(0)
  })

  it("ignores specials for another business", () => {
    const result = apply({
      specials: [lineDiscount({ businessId: "other-business" })],
    })

    expect(result.discountTotal).toBe(0)
  })

  it("ignores specials that have not started", () => {
    const result = apply({
      specials: [lineDiscount({ startsAt: "2026-06-07T00:00:00.000Z" })],
    })

    expect(result.discountTotal).toBe(0)
  })

  it("ignores expired specials", () => {
    const result = apply({
      specials: [lineDiscount({ endsAt: "2026-06-05T00:00:00.000Z" })],
    })

    expect(result.discountTotal).toBe(0)
  })

  it("accepts open-ended schedules", () => {
    const result = apply({
      specials: [
        lineDiscount({
          startsAt: "2026-06-01T00:00:00.000Z",
          endsAt: null,
        }),
      ],
    })

    expect(result.discountTotal).toBe(4)
  })

  it("accepts missing schedule bounds", () => {
    const result = apply({
      specials: [lineDiscount({ startsAt: null, endsAt: null })],
    })

    expect(result.discountTotal).toBe(4)
  })

  it("ignores zero and negative discount values", () => {
    expect(apply({ specials: [lineDiscount({ discountValue: 0 })] }).total).toBe(
      52
    )
    expect(
      apply({ specials: [lineDiscount({ discountValue: -5 })] }).total
    ).toBe(52)
  })

  it("chooses the best single discount and does not stack", () => {
    const result = apply({
      specials: [
        lineDiscount({ id: "smaller", discountValue: 10 }),
        cartDiscount({ id: "larger", discountValue: 20 }),
      ],
    })

    expect(result.appliedSpecialId).toBe("larger")
    expect(result.discountTotal).toBe(20)
    expect(result.total).toBe(32)
    expect(result.appliedDiscounts).toHaveLength(1)
  })

  it("uses lexicographically smaller special id as deterministic tie-breaker", () => {
    const result = apply({
      specials: [
        cartDiscount({ id: "b-special", discountValue: 5 }),
        cartDiscount({ id: "a-special", discountValue: 5 }),
      ],
    })

    expect(result.appliedSpecialId).toBe("a-special")
  })

  it("applies a percentage line discount to an eligible product", () => {
    const result = apply({
      specials: [
        lineDiscount({
          discountType: "percentage",
          discountValue: 25,
          eligibleProducts: [{ productId: "pizza" }],
        }),
      ],
    })

    expect(result.discountTotal).toBe(10)
    expect(result.total).toBe(42)
    expect(result.appliedDiscounts).toEqual([
      expect.objectContaining({
        lineId: "line-pizza",
        orderItemId: "order-item-pizza",
        specialId: "special-line",
        businessId,
        nameSnapshot: "Line Discount",
        specialTypeSnapshot: "line_discount",
        discountTypeSnapshot: "percentage",
        discountValueSnapshot: 25,
        amount: 10,
        couponCodeSnapshot: null,
      }),
    ])
  })

  it("applies a percentage line discount to an eligible menu group", () => {
    const result = apply({
      specials: [
        lineDiscount({
          eligibleProducts: [],
          eligibleMenuGroupIds: ["salads"],
          discountValue: 50,
        }),
      ],
    })

    expect(result.discountTotal).toBe(6)
    expect(result.appliedDiscounts[0]).toEqual(
      expect.objectContaining({
        lineId: "line-salad",
        amount: 6,
      })
    )
  })

  it("applies a line special with no eligibility rows to all lines", () => {
    const result = apply({
      specials: [
        lineDiscount({
          eligibleProducts: [],
          eligibleMenuGroupIds: [],
          discountValue: 10,
        }),
      ],
    })

    expect(result.discountTotal).toBe(5.2)
    expect(result.appliedDiscounts).toHaveLength(2)
  })

  it("applies fixed amount line discount per item quantity", () => {
    const result = apply({
      specials: [
        lineDiscount({
          discountType: "fixed_amount",
          discountValue: 3,
          eligibleProducts: [{ productId: "pizza" }],
        }),
      ],
    })

    expect(result.discountTotal).toBe(6)
  })

  it("caps fixed amount line discount at line subtotal", () => {
    const result = apply({
      specials: [
        lineDiscount({
          discountType: "fixed_amount",
          discountValue: 30,
          eligibleProducts: [{ productId: "pizza" }],
        }),
      ],
    })

    expect(result.discountTotal).toBe(40)
    expect(result.total).toBe(12)
  })

  it("ignores ineligible line products", () => {
    const result = apply({
      specials: [
        lineDiscount({
          eligibleProducts: [{ productId: "wings" }],
          eligibleMenuGroupIds: [],
        }),
      ],
    })

    expect(result.discountTotal).toBe(0)
  })

  it("matches variant-specific product eligibility", () => {
    const result = apply({
      specials: [
        lineDiscount({
          eligibleProducts: [
            { productId: "pizza", variantGroupOptionId: "large" },
          ],
        }),
      ],
    })

    expect(result.discountTotal).toBe(4)
  })

  it("rejects variant-specific eligibility for the wrong selected variant", () => {
    const result = apply({
      specials: [
        lineDiscount({
          eligibleProducts: [
            { productId: "pizza", variantGroupOptionId: "small" },
          ],
        }),
      ],
    })

    expect(result.discountTotal).toBe(0)
  })

  it("applies fixed price line special to lower an eligible product", () => {
    const result = apply({
      specials: [fixedPriceLine({ discountValue: 15 })],
    })

    expect(result.discountTotal).toBe(10)
    expect(result.total).toBe(42)
  })

  it("applies fixed price per quantity", () => {
    const result = apply({
      specials: [fixedPriceLine({ discountValue: 12 })],
    })

    expect(result.discountTotal).toBe(16)
  })

  it("ignores fixed price line special when fixed price is higher than current price", () => {
    const result = apply({
      specials: [fixedPriceLine({ discountValue: 30 })],
    })

    expect(result.discountTotal).toBe(0)
  })

  it("applies fixed price line with variant-specific eligibility", () => {
    const result = apply({
      specials: [
        fixedPriceLine({
          eligibleProducts: [
            { productId: "pizza", variantGroupOptionId: "large" },
          ],
        }),
      ],
    })

    expect(result.discountTotal).toBe(10)
  })

  it("ignores unsupported fixed price line discount types", () => {
    const result = apply({
      specials: [
        fixedPriceLine({
          discountType: "percentage",
          discountValue: 50,
        }),
      ],
    })

    expect(result.discountTotal).toBe(0)
  })

  it("applies percentage cart discount to subtotal", () => {
    const result = apply({
      specials: [
        cartDiscount({
          discountType: "percentage",
          discountValue: 10,
        }),
      ],
    })

    expect(result.discountTotal).toBe(5.2)
    expect(result.total).toBe(46.8)
  })

  it("applies fixed amount cart discount to subtotal", () => {
    const result = apply({
      specials: [cartDiscount({ discountValue: 7 })],
    })

    expect(result.discountTotal).toBe(7)
    expect(result.total).toBe(45)
  })

  it("requires cart discount minimum order amount to pass", () => {
    expect(
      apply({
        specials: [cartDiscount({ minOrderAmount: 50, discountValue: 5 })],
      }).discountTotal
    ).toBe(5)
    expect(
      apply({
        specials: [cartDiscount({ minOrderAmount: 60, discountValue: 5 })],
      }).discountTotal
    ).toBe(0)
  })

  it("caps cart discount at subtotal", () => {
    const result = apply({
      specials: [cartDiscount({ discountValue: 100 })],
    })

    expect(result.discountTotal).toBe(52)
    expect(result.total).toBe(0)
  })

  it("applies cart discount with no eligibility rows to full cart", () => {
    const result = apply({
      specials: [
        cartDiscount({
          eligibleProducts: [],
          eligibleMenuGroupIds: [],
          discountValue: 5,
        }),
      ],
    })

    expect(result.discountTotal).toBe(5)
  })

  it("ignores unsupported fixed price cart discounts", () => {
    const result = apply({
      specials: [
        cartDiscount({
          discountType: "fixed_price",
          discountValue: 20,
        }),
      ],
    })

    expect(result.discountTotal).toBe(0)
  })

  it("creates order-level snapshot with null line reference for cart discount", () => {
    const result = apply({
      specials: [cartDiscount({ discountValue: 5 })],
    })

    expect(result.appliedDiscounts).toEqual([
      expect.objectContaining({
        lineId: null,
        orderItemId: null,
        specialId: "special-cart",
        nameSnapshot: "Cart Discount",
        specialTypeSnapshot: "cart_discount",
        amount: 5,
      }),
    ])
  })

  it("reports per-line adjusted totals for line discounts", () => {
    const result = apply({
      specials: [
        lineDiscount({
          discountType: "fixed_amount",
          discountValue: 3,
          eligibleProducts: [{ productId: "pizza" }],
        }),
      ],
    })

    expect(result.lineTotals).toEqual([
      {
        lineId: "line-pizza",
        lineSubtotal: 40,
        discountTotal: 6,
        total: 34,
      },
      {
        lineId: "line-salad",
        lineSubtotal: 12,
        discountTotal: 0,
        total: 12,
      },
    ])
  })
})
