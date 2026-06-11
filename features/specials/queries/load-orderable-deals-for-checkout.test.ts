import { describe, expect, it, vi } from "vitest"
import { mapCheckoutOrderableDeal } from "./load-orderable-deals-for-checkout"

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {},
}))

const rawDeal = {
  id: "deal-1",
  business_id: "business-1",
  name: "Family Deal",
  special_type: "orderable_deal",
  discount_value: "24.99",
  is_enabled: true,
  starts_at: null,
  ends_at: null,
  special_availability_windows: [],
  special_components: [
    {
      id: "component-1",
      label: "Choose a pizza",
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
          product_id: "product-1",
          special_component_product_variant_options: [
            { variant_group_option_id: "variant-large" },
          ],
          products: {
            id: "product-1",
            business_id: "business-1",
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

describe("mapCheckoutOrderableDeal", () => {
  it("maps component product variant restrictions for checkout validation", () => {
    const deal = mapCheckoutOrderableDeal({
      rawDeal,
      businessId: "business-1",
      currentTime: new Date("2026-06-06T12:00:00Z"),
      timeZone: "America/New_York",
    })

    expect(deal?.components[0]).toMatchObject({
      componentId: "component-1",
      pricingMode: "fixed_price",
      fixedPrice: 7.99,
      allowedProductIds: ["product-1"],
      allowedProductVariantOptions: [
        {
          productId: "product-1",
          allowedVariantOptionIds: ["variant-large"],
        },
      ],
      modifierGroupOverrides: [
        {
          productId: "product-1",
          modifierGroupId: "modifier-toppings",
          includedSelectionCount: 2,
        },
      ],
    })
  })

  it("defaults missing component pricing mode to included", () => {
    const deal = mapCheckoutOrderableDeal({
      rawDeal: {
        ...rawDeal,
        special_components: [
          {
            ...rawDeal.special_components[0],
            pricing_mode: null,
            fixed_price: null,
          },
        ],
      },
      businessId: "business-1",
      currentTime: new Date("2026-06-06T12:00:00Z"),
      timeZone: "America/New_York",
    })

    expect(deal?.components[0]).toMatchObject({
      pricingMode: "included",
      fixedPrice: null,
    })
  })

  it("excludes temporarily sold-out component products from checkout eligibility", () => {
    const deal = mapCheckoutOrderableDeal({
      rawDeal: {
        ...rawDeal,
        special_components: [
          {
            ...rawDeal.special_components[0],
            special_component_products: [
              {
                ...rawDeal.special_components[0]
                  .special_component_products[0],
                products: {
                  ...rawDeal.special_components[0]
                    .special_component_products[0].products,
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
        ],
      },
      businessId: "business-1",
      currentTime: new Date("2026-06-06T12:00:00Z"),
      timeZone: "America/New_York",
    })

    expect(deal?.components[0]?.allowedProductIds).toEqual([])
    expect(deal?.components[0]?.allowedProductVariantOptions).toEqual([])
  })
})
