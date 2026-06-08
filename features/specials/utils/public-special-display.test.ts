import { describe, expect, it } from "vitest"
import type { PublicSpecial } from "@/features/specials/types/public-special"
import {
  getPublicProductSpecialBadge,
  isProductEligibleForPublicSpecial,
} from "./public-special-display"

function buildSpecial(
  overrides: Partial<PublicSpecial> = {}
): PublicSpecial {
  return {
    id: "special-a",
    businessId: "business-a",
    name: "Pizza Night",
    customerDescription: null,
    specialType: "line_discount",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    eligibleProducts: [],
    eligibleMenuGroupIds: [],
    availabilityWindows: [],
    ...overrides,
  }
}

describe("public special display helpers", () => {
  it("marks products eligible by product id", () => {
    const special = buildSpecial({
      eligibleProducts: [{ productId: "product-a" }],
    })

    expect(
      isProductEligibleForPublicSpecial({
        special,
        product: { productId: "product-a", menuGroupIds: [] },
      })
    ).toBe(true)
  })

  it("marks products eligible by menu group id", () => {
    const special = buildSpecial({
      eligibleMenuGroupIds: ["menu-group-a"],
    })

    expect(
      isProductEligibleForPublicSpecial({
        special,
        product: {
          productId: "product-a",
          menuGroupIds: ["category-a", "menu-group-a"],
        },
      })
    ).toBe(true)
  })

  it("does not mark unrelated products eligible", () => {
    const special = buildSpecial({
      eligibleProducts: [{ productId: "product-a" }],
    })

    expect(
      isProductEligibleForPublicSpecial({
        special,
        product: { productId: "product-b", menuGroupIds: [] },
      })
    ).toBe(false)
  })

  it("does not show product badges for cart discounts", () => {
    const badge = getPublicProductSpecialBadge({
      specials: [
        buildSpecial({
          specialType: "cart_discount",
          discountType: "fixed_amount",
          discountValue: 5,
        }),
      ],
      product: { productId: "product-a", menuGroupIds: ["menu-group-a"] },
    })

    expect(badge).toBeNull()
  })

  it("formats the first eligible product badge", () => {
    const badge = getPublicProductSpecialBadge({
      specials: [buildSpecial()],
      product: { productId: "product-a", menuGroupIds: ["menu-group-a"] },
    })

    expect(badge).toBe("20% off")
  })
})
