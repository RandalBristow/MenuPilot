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
  mapRawSpecial,
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

  it("maps mix and match rule, pool products, variant restrictions, and zero modifier overrides", () => {
    const special = mapRawSpecial({
      special: {
        id: "special-mix",
        name: "Any 2 Pizzas",
        description: null,
        customer_description: "Choose any two.",
        special_type: "mix_and_match_fixed_unit_price",
        discount_type: "fixed_price",
        discount_value: "7.99",
        min_order_amount: null,
        starts_at: null,
        ends_at: null,
        is_enabled: true,
        created_at: "2026-01-01T00:00:00.000Z",
        special_availability_windows: null,
        special_products: null,
        special_menu_groups: null,
        special_components: null,
        special_mix_match_rules: {
          id: "mix-rule",
          min_quantity: 2,
          max_quantity: 4,
          unit_price: "7.99",
          allow_extra_items: true,
        },
        special_mix_match_products: [
          {
            id: "mix-product-b",
            product_id: "product-b",
            sort_order: 2,
            special_mix_match_product_variant_options: null,
            special_mix_match_modifier_group_overrides: null,
          },
          {
            id: "mix-product-a",
            product_id: "product-a",
            sort_order: 1,
            special_mix_match_product_variant_options: [
              { variant_group_option_id: "variant-large" },
            ],
            special_mix_match_modifier_group_overrides: [
              {
                product_id: "product-a",
                modifier_group_id: "modifier-toppings",
                included_selection_count: "0",
              },
            ],
          },
        ],
      },
      productNamesById: new Map([
        ["product-a", "Deluxe Pizza"],
        ["product-b", "Meat Pizza"],
      ]),
      menuGroupNamesById: new Map(),
      currentTime: new Date("2026-01-01T00:00:00.000Z"),
    })

    expect(special.eligibilitySummary).toBe("2 pool products")
    expect(special.mixMatchRule).toEqual(
      expect.objectContaining({
        id: "mix-rule",
        minQuantity: 2,
        maxQuantity: 4,
        unitPrice: 7.99,
        allowExtraItems: true,
        productIds: ["product-a", "product-b"],
        productVariantRestrictions: [
          {
            productId: "product-a",
            allowedVariantOptionIds: ["variant-large"],
          },
        ],
        modifierGroupOverrides: [
          {
            productId: "product-a",
            modifierGroupId: "modifier-toppings",
            includedSelectionCount: 0,
          },
        ],
      })
    )
  })

  it("maps orderable deal component pricing modes and defaults old rows to included", () => {
    const special = mapRawSpecial({
      special: {
        id: "special-deal",
        name: "Family Night",
        description: null,
        customer_description: null,
        special_type: "orderable_deal",
        discount_type: "fixed_price",
        discount_value: "29.99",
        min_order_amount: null,
        starts_at: null,
        ends_at: null,
        is_enabled: true,
        created_at: "2026-01-01T00:00:00.000Z",
        special_availability_windows: null,
        special_products: null,
        special_menu_groups: null,
        special_components: [
          {
            id: "component-fixed",
            label: "Choose first pizza",
            description: null,
            sort_order: 1,
            required_quantity: 1,
            min_quantity: 1,
            max_quantity: 1,
            pricing_behavior: "included_base",
            pricing_mode: "fixed_price",
            fixed_price: "7.99",
            is_required: true,
            special_component_products: [
              {
                id: "component-product-a",
                product_id: "product-a",
                special_component_product_variant_options: [
                  { variant_group_option_id: "variant-large" },
                ],
              },
            ],
            special_component_modifier_group_overrides: [
              {
                product_id: "product-a",
                modifier_group_id: "modifier-toppings",
                included_selection_count: "2",
              },
            ],
          },
          {
            id: "component-old",
            label: "Choose soda",
            description: null,
            sort_order: 2,
            required_quantity: 1,
            min_quantity: 1,
            max_quantity: 1,
            pricing_behavior: "included_base",
            pricing_mode: null,
            fixed_price: null,
            is_required: true,
            special_component_products: null,
            special_component_modifier_group_overrides: null,
          },
        ],
        special_mix_match_rules: null,
        special_mix_match_products: null,
      },
      productNamesById: new Map([["product-a", "Build Your Own Pizza"]]),
      menuGroupNamesById: new Map(),
      currentTime: new Date("2026-01-01T00:00:00.000Z"),
    })

    expect(special.components).toEqual([
      expect.objectContaining({
        id: "component-fixed",
        pricingMode: "fixed_price",
        fixedPrice: 7.99,
        productVariantRestrictions: [
          {
            productId: "product-a",
            allowedVariantOptionIds: ["variant-large"],
          },
        ],
        modifierGroupOverrides: [
          {
            productId: "product-a",
            modifierGroupId: "modifier-toppings",
            includedSelectionCount: 2,
          },
        ],
      }),
      expect.objectContaining({
        id: "component-old",
        pricingMode: "included",
        fixedPrice: null,
      }),
    ])
  })
})
