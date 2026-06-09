import { describe, expect, it, vi } from "vitest"
import { mapCheckoutMixAndMatchDeal } from "./load-mix-and-match-deals-for-checkout"

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {},
}))

const rawDeal = {
  id: "mix-1",
  business_id: "business-1",
  name: "Any 2 Subs",
  special_type: "mix_and_match_fixed_unit_price",
  is_enabled: true,
  starts_at: null,
  ends_at: null,
  special_availability_windows: [],
  special_mix_match_rules: {
    min_quantity: 2,
    max_quantity: null,
    unit_price: "7.99",
    allow_extra_items: true,
  },
  special_mix_match_products: [
    {
      product_id: "product-1",
      sort_order: 2,
      products: {
        id: "product-1",
        business_id: "business-1",
        is_enabled: true,
      },
      special_mix_match_product_variant_options: [
        { variant_group_option_id: "variant-large" },
      ],
      special_mix_match_modifier_group_overrides: [
        {
          product_id: "product-1",
          modifier_group_id: "modifier-toppings",
          included_selection_count: "2",
        },
      ],
    },
  ],
}

describe("mapCheckoutMixAndMatchDeal", () => {
  it("maps rule, variant restrictions, and modifier overrides for checkout", () => {
    const deal = mapCheckoutMixAndMatchDeal({
      rawDeal,
      businessId: "business-1",
      currentTime: new Date("2026-06-08T12:00:00.000Z"),
      timeZone: "America/New_York",
    })

    expect(deal).toMatchObject({
      businessId: "business-1",
      specialId: "mix-1",
      specialType: "mix_and_match_fixed_unit_price",
      rule: {
        minQuantity: 2,
        maxQuantity: null,
        unitPrice: 7.99,
        allowExtraItems: true,
      },
      poolProducts: [
        {
          productId: "product-1",
          allowedVariantOptionIds: ["variant-large"],
          modifierGroupOverrides: [
            {
              modifierGroupId: "modifier-toppings",
              includedSelectionCount: 2,
            },
          ],
        },
      ],
    })
  })
})
