import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase/client", () => ({
  supabase: {},
}))

import { mapPublicMixAndMatchDeal } from "./load-public-mix-and-match-deal"

const activeRawDeal = {
  id: "mix-1",
  business_id: "business-1",
  name: "Any 2 Pizzas",
  customer_description: "Choose any two.",
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
      id: "mix-product-1",
      product_id: "product-1",
      sort_order: 1,
      special_mix_match_product_variant_options: [],
      special_mix_match_modifier_group_overrides: [],
      products: {
        id: "product-1",
        business_id: "business-1",
        name: "Cheese Pizza",
        description: "Classic cheese.",
        base_price: 12,
        builder_template: "pizza",
        has_variants: true,
        is_enabled: true,
        image_media_id: null,
        media_assets: null,
      },
    },
  ],
}

describe("mapPublicMixAndMatchDeal", () => {
  it("maps active pool products", () => {
    const deal = mapPublicMixAndMatchDeal({
      rawDeal: activeRawDeal,
      businessId: "business-1",
      currentTime: new Date("2026-06-10T12:00:00Z"),
      timeZone: "America/New_York",
    })

    expect(deal?.products).toMatchObject([
      {
        id: "product-1",
        name: "Cheese Pizza",
      },
    ])
  })

  it("removes active temporarily sold-out pool products", () => {
    const deal = mapPublicMixAndMatchDeal({
      rawDeal: {
        ...activeRawDeal,
        special_mix_match_products: [
          {
            ...activeRawDeal.special_mix_match_products[0],
            products: {
              ...activeRawDeal.special_mix_match_products[0].products,
              product_operational_availability: [
                {
                  id: "availability-1",
                  location_id: null,
                  is_86d: true,
                  reason: "Sold out",
                  expires_at: null,
                },
              ],
            },
          },
        ],
      },
      businessId: "business-1",
      currentTime: new Date("2026-06-10T12:00:00Z"),
      timeZone: "America/New_York",
    })

    expect(deal?.products).toHaveLength(0)
  })

  it("keeps pool products when a temporary sold-out override expired", () => {
    const deal = mapPublicMixAndMatchDeal({
      rawDeal: {
        ...activeRawDeal,
        special_mix_match_products: [
          {
            ...activeRawDeal.special_mix_match_products[0],
            products: {
              ...activeRawDeal.special_mix_match_products[0].products,
              product_operational_availability: [
                {
                  id: "availability-1",
                  location_id: null,
                  is_86d: true,
                  reason: null,
                  expires_at: "2026-06-10T11:00:00Z",
                },
              ],
            },
          },
        ],
      },
      businessId: "business-1",
      currentTime: new Date("2026-06-10T12:00:00Z"),
      timeZone: "America/New_York",
    })

    expect(deal?.products).toHaveLength(1)
  })
})
