import { describe, expect, it } from "vitest"
import {
  filterEnabledProductVariants,
  isVariantProductUnavailable,
} from "./filter-enabled-product-variants"

const variants = [
  {
    id: "small",
    is_enabled: true,
    sort_order: 2,
  },
  {
    id: "large",
    is_enabled: false,
    sort_order: 1,
  },
  {
    id: "medium",
    is_enabled: true,
    sort_order: 0,
  },
]

describe("filterEnabledProductVariants", () => {
  it("shows enabled variants in customer builders", () => {
    expect(filterEnabledProductVariants(variants).map((variant) => variant.id)).toEqual([
      "medium",
      "small",
    ])
  })

  it("hides disabled variants in customer builders", () => {
    expect(filterEnabledProductVariants(variants)).not.toContainEqual(
      expect.objectContaining({ id: "large" })
    )
  })

  it("treats products with all disabled variants as unavailable", () => {
    expect(
      isVariantProductUnavailable({
        has_variants: true,
        variants: [
          {
            is_enabled: false,
            sort_order: 0,
          },
        ],
      })
    ).toBe(true)
  })

  it("does not mark products without variants as unavailable", () => {
    expect(
      isVariantProductUnavailable({
        has_variants: false,
        variants: [],
      })
    ).toBe(false)
  })
})
