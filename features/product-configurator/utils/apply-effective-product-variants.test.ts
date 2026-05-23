import { describe, expect, it } from "vitest"
import {
  applyEffectiveVariants,
  resolveVariantsForProduct,
  type ProductWithVariantSources,
} from "./apply-effective-product-variants"

const pizzaSizeGroup = {
  id: "pizza-sizes",
  variant_group_options: [
    {
      id: "size-10",
      name: '10"',
      base_price: 8.99,
      is_default: false,
      is_enabled: true,
      sort_order: 1,
    },
    {
      id: "size-12",
      name: '12"',
      base_price: 11.99,
      is_default: true,
      is_enabled: true,
      sort_order: 2,
    },
    {
      id: "size-14",
      name: '14"',
      base_price: 14.99,
      is_default: false,
      is_enabled: true,
      sort_order: 3,
    },
    {
      id: "size-16",
      name: '16"',
      base_price: 17.99,
      is_default: false,
      is_enabled: true,
      sort_order: 4,
    },
  ],
}

function productWithVariantGroup(
  overrides: ProductWithVariantSources["product_variant_option_overrides"] = []
): ProductWithVariantSources {
  return {
    product_variant_groups: [
      {
        id: "assignment-pizza-sizes",
        is_enabled: true,
        sort_order: 1,
        variant_groups: pizzaSizeGroup,
      },
    ],
    product_variant_option_overrides: overrides,
  }
}

describe("resolveVariantsForProduct", () => {
  it("returns reusable Pizza Sizes options for an assigned product", () => {
    const variants = resolveVariantsForProduct(productWithVariantGroup())

    expect(variants.map((variant) => variant.name)).toEqual([
      '10"',
      '12"',
      '14"',
      '16"',
    ])
    expect(variants.every((variant) => variant.source_type === "variant_group_option")).toBe(
      true
    )
  })

  it("applies product-specific price overrides and inherits other group prices", () => {
    const variants = resolveVariantsForProduct(
      productWithVariantGroup([
        {
          variant_group_option_id: "size-16",
          price_override: 19.49,
          is_enabled: null,
          is_default: null,
          sort_order: null,
        },
      ])
    )

    expect(variants.find((variant) => variant.id === "size-16")?.base_price).toBe(
      19.49
    )
    expect(variants.find((variant) => variant.id === "size-10")?.base_price).toBe(
      8.99
    )
    expect(variants.find((variant) => variant.id === "size-12")?.base_price).toBe(
      11.99
    )
    expect(variants.find((variant) => variant.id === "size-14")?.base_price).toBe(
      14.99
    )
  })

  it("excludes product-specific disabled options from customer-facing variants", () => {
    const variants = resolveVariantsForProduct(
      productWithVariantGroup([
        {
          variant_group_option_id: "size-10",
          price_override: null,
          is_enabled: false,
          is_default: null,
          sort_order: null,
        },
      ])
    )

    expect(variants.map((variant) => variant.id)).toEqual([
      "size-12",
      "size-14",
      "size-16",
    ])
  })

  it("applies product-specific default overrides and keeps one default", () => {
    const variants = resolveVariantsForProduct(
      productWithVariantGroup([
        {
          variant_group_option_id: "size-12",
          price_override: null,
          is_enabled: null,
          is_default: true,
          sort_order: null,
        },
        {
          variant_group_option_id: "size-16",
          price_override: null,
          is_enabled: null,
          is_default: true,
          sort_order: null,
        },
      ])
    )

    expect(variants.filter((variant) => variant.is_default)).toEqual([
      expect.objectContaining({ id: "size-12" }),
    ])
    expect(variants.filter((variant) => variant.is_default)).toHaveLength(1)
  })

  it("returns empty variants when no reusable variant group is assigned", () => {
    expect(resolveVariantsForProduct({})).toEqual([])
  })

  it("safely returns empty variants when all assigned group options are disabled", () => {
    const variants = resolveVariantsForProduct({
      product_variant_groups: [
        {
          id: "assignment-pizza-sizes",
          is_enabled: true,
          sort_order: 1,
          variant_groups: {
            ...pizzaSizeGroup,
            variant_group_options: pizzaSizeGroup.variant_group_options.map(
              (option) => ({
                ...option,
                is_enabled: false,
              })
            ),
          },
        },
      ],
      product_variant_option_overrides: [],
    })

    expect(variants).toEqual([])
  })
})

describe("applyEffectiveVariants", () => {
  it("adds an empty variants list for products without reusable assignments", () => {
    const product = applyEffectiveVariants({
      id: "build-your-own-pizza",
      base_price: 0,
      product_variant_groups: [],
      product_variant_option_overrides: [],
    })

    expect(product.variants).toEqual([])
  })
})
