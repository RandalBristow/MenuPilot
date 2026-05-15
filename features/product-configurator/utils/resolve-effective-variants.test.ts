import { describe, expect, it } from "vitest"
import { resolveEffectiveVariants } from "./resolve-effective-variants"

const pizzaSizeGroup = {
  id: "pizza-sizes",
  is_enabled: true,
  variant_group_options: [
    {
      id: "size-12",
      name: '12"',
      base_price: 11.99,
      is_default: true,
      is_enabled: true,
      sort_order: 2,
    },
    {
      id: "size-10",
      name: '10"',
      base_price: 8.99,
      is_default: false,
      is_enabled: true,
      sort_order: 1,
    },
  ],
}

describe("resolveEffectiveVariants", () => {
  it("returns no variants when no reusable group is attached", () => {
    const variants = resolveEffectiveVariants({
    })

    expect(variants).toEqual([])
  })

  it("uses reusable variant group options when an enabled group is attached", () => {
    const variants = resolveEffectiveVariants({
      attachedVariantGroups: [pizzaSizeGroup],
    })

    expect(variants.map((variant) => variant.id)).toEqual([
      "size-10",
      "size-12",
    ])
    expect(variants.every((variant) => variant.source_type === "variant_group_option")).toBe(
      true
    )
  })

  it("hides disabled group options", () => {
    const variants = resolveEffectiveVariants({
      attachedVariantGroups: [
        {
          ...pizzaSizeGroup,
          variant_group_options: [
            ...pizzaSizeGroup.variant_group_options,
            {
              id: "size-14",
              name: '14"',
              base_price: 14.99,
              is_default: false,
              is_enabled: false,
              sort_order: 3,
            },
          ],
        },
      ],
    })

    expect(variants.map((variant) => variant.id)).not.toContain("size-14")
  })

  it("applies product overrides that disable an option", () => {
    const variants = resolveEffectiveVariants({
      attachedVariantGroups: [pizzaSizeGroup],
      variantOptionOverrides: [
        {
          variant_group_option_id: "size-10",
          price_override: null,
          is_enabled: false,
          is_default: null,
          sort_order: null,
        },
      ],
    })

    expect(variants.map((variant) => variant.id)).toEqual(["size-12"])
  })

  it("applies price overrides", () => {
    const variants = resolveEffectiveVariants({
      attachedVariantGroups: [pizzaSizeGroup],
      variantOptionOverrides: [
        {
          variant_group_option_id: "size-10",
          price_override: 9.49,
          is_enabled: null,
          is_default: null,
          sort_order: null,
        },
      ],
    })

    expect(variants.find((variant) => variant.id === "size-10")?.base_price).toBe(
      9.49
    )
  })

  it("applies default overrides and keeps one effective default", () => {
    const variants = resolveEffectiveVariants({
      attachedVariantGroups: [pizzaSizeGroup],
      variantOptionOverrides: [
        {
          variant_group_option_id: "size-10",
          price_override: null,
          is_enabled: null,
          is_default: true,
          sort_order: null,
        },
      ],
    })

    expect(variants.filter((variant) => variant.is_default)).toEqual([
      expect.objectContaining({ id: "size-10" }),
    ])
  })

  it("applies sort order overrides", () => {
    const variants = resolveEffectiveVariants({
      attachedVariantGroups: [pizzaSizeGroup],
      variantOptionOverrides: [
        {
          variant_group_option_id: "size-12",
          price_override: null,
          is_enabled: null,
          is_default: null,
          sort_order: 0,
        },
      ],
    })

    expect(variants.map((variant) => variant.id)).toEqual([
      "size-12",
      "size-10",
    ])
  })
})
