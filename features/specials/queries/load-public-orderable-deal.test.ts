import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase/client", () => ({
  supabase: {},
}))

import { mapPublicOrderableDeal } from "./load-public-orderable-deal"

const activeRawDeal = {
  id: "deal-1",
  business_id: "business-1",
  name: "Family Deal",
  customer_description: "Pizza and drinks.",
  special_type: "orderable_deal",
  discount_value: 24.99,
  is_enabled: true,
  starts_at: null,
  ends_at: null,
  special_availability_windows: [],
  special_components: [
    {
      id: "component-1",
      label: "Choose a pizza",
      description: null,
      sort_order: 1,
      required_quantity: 1,
      min_quantity: 1,
      max_quantity: 1,
      pricing_behavior: "included_base" as const,
      pricing_mode: "fixed_price" as const,
      fixed_price: "7.99",
      is_required: true,
      special_component_products: [
        {
          sort_order: 1,
          special_component_product_variant_options: [
            { variant_group_option_id: "variant-large" },
          ],
          products: {
            id: "product-1",
            business_id: "business-1",
            name: "Cheese Pizza",
            description: "Classic cheese.",
            base_price: 12,
            builder_template: "pizza",
            has_variants: true,
            is_enabled: true,
          },
        },
      ],
      special_component_modifier_group_overrides: [
        {
          product_id: "product-1",
          modifier_group_id: "modifier-toppings",
          included_selection_count: "2",
        },
      ],
    },
  ],
}

describe("mapPublicOrderableDeal", () => {
  it("maps active orderable deal components and products for the selected business", () => {
    const deal = mapPublicOrderableDeal({
      rawDeal: activeRawDeal,
      businessSlug: "demo",
      businessId: "business-1",
      currentTime: new Date("2026-06-06T12:00:00Z"),
      timeZone: "America/New_York",
    })

    expect(deal).toMatchObject({
      id: "deal-1",
      businessId: "business-1",
      businessSlug: "demo",
      name: "Family Deal",
      dealBasePrice: 24.99,
      components: [
        {
          id: "component-1",
          label: "Choose a pizza",
          pricingMode: "fixed_price",
          fixedPrice: 7.99,
          products: [
            {
              id: "product-1",
              name: "Cheese Pizza",
              allowedVariantOptionIds: ["variant-large"],
              modifierGroupOverrides: [
                {
                  modifierGroupId: "modifier-toppings",
                  includedSelectionCount: 2,
                },
              ],
            },
          ],
        },
      ],
    })
  })

  it("defaults missing component pricing mode to included", () => {
    const deal = mapPublicOrderableDeal({
      rawDeal: {
        ...activeRawDeal,
        special_components: [
          {
            ...activeRawDeal.special_components[0],
            pricing_mode: null,
            fixed_price: null,
          },
        ],
      },
      businessSlug: "demo",
      businessId: "business-1",
      currentTime: new Date("2026-06-06T12:00:00Z"),
      timeZone: "America/New_York",
    })

    expect(deal?.components[0]).toMatchObject({
      pricingMode: "included",
      fixedPrice: null,
    })
  })

  it("rejects wrong-business deals", () => {
    expect(
      mapPublicOrderableDeal({
        rawDeal: activeRawDeal,
        businessId: "business-2",
        currentTime: new Date("2026-06-06T12:00:00Z"),
      })
    ).toBeNull()
  })

  it("rejects disabled or future deals", () => {
    expect(
      mapPublicOrderableDeal({
        rawDeal: {
          ...activeRawDeal,
          is_enabled: false,
        },
        businessId: "business-1",
        currentTime: new Date("2026-06-06T12:00:00Z"),
      })
    ).toBeNull()

    expect(
      mapPublicOrderableDeal({
        rawDeal: {
          ...activeRawDeal,
          starts_at: "2026-06-07T12:00:00Z",
        },
        businessId: "business-1",
        currentTime: new Date("2026-06-06T12:00:00Z"),
      })
    ).toBeNull()
  })
})
