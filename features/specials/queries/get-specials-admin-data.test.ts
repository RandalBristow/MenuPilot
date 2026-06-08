import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {},
}))

vi.mock("@/features/tenant/queries/resolve-business-context", () => ({
  resolveBusinessContext: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}))

import {
  formatDiscountSummary,
  mapProductOptions,
  type RawProductOption,
} from "./get-specials-admin-data"

describe("specials admin data helpers", () => {
  it("summarizes orderable deals as base price", () => {
    expect(
      formatDiscountSummary({
        specialType: "orderable_deal",
        discountType: "fixed_price",
        discountValue: 29.99,
      })
    ).toBe("$29.99 base price")
  })

  it("summarizes mix and match deals from the mix rule", () => {
    expect(
      formatDiscountSummary({
        specialType: "mix_and_match_fixed_unit_price",
        discountType: "fixed_price",
        discountValue: 7.99,
        mixMatchRule: {
          id: "mix-rule",
          minQuantity: 2,
          maxQuantity: null,
          unitPrice: 7.99,
          allowExtraItems: true,
          productIds: ["product-a", "product-b"],
          productVariantRestrictions: [],
          modifierGroupOverrides: [],
        },
      })
    ).toBe("Any 2+ for $7.99 each")

    expect(
      formatDiscountSummary({
        specialType: "mix_and_match_fixed_unit_price",
        discountType: "fixed_price",
        discountValue: 7.99,
        mixMatchRule: {
          id: "mix-rule",
          minQuantity: 2,
          maxQuantity: 4,
          unitPrice: 7.99,
          allowExtraItems: true,
          productIds: ["product-a", "product-b"],
          productVariantRestrictions: [],
          modifierGroupOverrides: [],
        },
      })
    ).toBe("Choose 2-4 for $7.99 each")
  })

  it("maps products with category and subcategory metadata", () => {
    const products = mapProductOptions([
      {
        id: "product-pizza",
        name: "Deluxe",
        description: null,
        is_enabled: true,
        builder_template: "pizza",
        product_groups: [
          {
            menu_group_id: "subcategory-specialty",
            is_primary: true,
            menu_groups: {
              id: "subcategory-specialty",
              name: "Specialty",
              parent_group_id: "category-pizza",
              sort_order: 2,
              is_enabled: true,
              parent_group: {
                id: "category-pizza",
                name: "Pizza",
                sort_order: 1,
                is_enabled: true,
              },
            },
          },
        ],
        product_variant_groups: [
          {
            id: "product-variant-group-a",
            is_enabled: true,
            sort_order: 1,
            variant_groups: {
              id: "variant-group-a",
              variant_group_options: [
                {
                  id: "variant-large",
                  name: "Large",
                  base_price: 19.99,
                  is_default: true,
                  is_enabled: true,
                  sort_order: 1,
                },
              ],
            },
          },
        ],
        product_variant_option_overrides: null,
      },
      {
        id: "product-drink",
        name: "Pepsi 2-Liter",
        description: null,
        is_enabled: true,
        builder_template: "simple",
        product_groups: [
          {
            menu_group_id: "subcategory-2-liters",
            is_primary: true,
            menu_groups: {
              id: "subcategory-2-liters",
              name: "2-Liters",
              parent_group_id: "category-drinks",
              sort_order: 1,
              is_enabled: true,
              parent_group: {
                id: "category-drinks",
                name: "Drinks",
                sort_order: 2,
                is_enabled: true,
              },
            },
          },
        ],
        product_variant_groups: null,
        product_variant_option_overrides: null,
      },
    ] satisfies RawProductOption[])

    expect(products).toEqual([
      expect.objectContaining({
        id: "product-pizza",
        parentMenuGroupName: "Pizza",
        menuGroupName: "Specialty",
        variants: [
          expect.objectContaining({
            id: "variant-large",
            name: "Large",
          }),
        ],
      }),
      expect.objectContaining({
        id: "product-drink",
        parentMenuGroupName: "Drinks",
        menuGroupName: "2-Liters",
      }),
    ])
  })
})
