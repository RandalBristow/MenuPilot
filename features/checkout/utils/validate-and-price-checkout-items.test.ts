import { describe, expect, it } from "vitest"
import type { DealCartItem } from "@/features/cart/types/cart"
import type { CheckoutProductConfig } from "./validate-and-price-cart"
import type { OrderableDealCandidate } from "@/features/specials/utils/validate-and-price-orderable-deal"
import type { MixAndMatchDealCandidate } from "@/features/specials/utils/validate-and-price-mix-and-match-deal"
import { validateAndPriceCheckoutItems } from "./validate-and-price-checkout-items"

const products: CheckoutProductConfig[] = [
  {
    id: "product-1",
    name: "Italian Sub",
    isEnabled: true,
    basePrice: 8.99,
  },
]

const mixDeal: MixAndMatchDealCandidate = {
  businessId: "business-1",
  specialId: "mix-special-1",
  name: "Any 2 Subs",
  specialType: "mix_and_match_fixed_unit_price",
  isEnabled: true,
  startsAt: null,
  endsAt: null,
  availabilityWindows: [],
  rule: {
    minQuantity: 2,
    maxQuantity: null,
    unitPrice: 7.99,
    allowExtraItems: true,
  },
  poolProducts: [{ productId: "product-1" }],
}

const mixDealItem: DealCartItem = {
  cartItemId: "mix-cart-1",
  itemType: "deal",
  specialType: "mix_and_match_fixed_unit_price",
  businessId: "business-1",
  businessSlug: "demo",
  locationId: null,
  locationSlug: null,
  specialId: "mix-special-1",
  specialName: "Any 2 Subs",
  ruleSummary: "Any 2+ for $7.99 each",
  selectedQuantity: 2,
  unitPrice: 7.99,
  mixBaseTotal: 15.98,
  dealBasePrice: 15.98,
  childExtraTotal: 0,
  totalPrice: 15.98,
  components: [
    {
      componentId: "mix:mix-special-1",
      componentLabel: "Mix & Match selections",
      sortOrder: 1,
      requiredQuantity: 2,
      selectedQuantity: 2,
      children: [
        {
          childLineId: "child-1",
          productId: "product-1",
          productName: "Italian Sub",
          variantId: null,
          variantName: null,
          quantity: 2,
          configuredLineTotal: 17.98,
          childExtraTotal: 0,
          modifiers: [],
        },
      ],
    },
  ],
}

const orderableDeal: OrderableDealCandidate = {
  businessId: "business-1",
  specialId: "orderable-special-1",
  name: "Two Pizzas and Soda",
  specialType: "orderable_deal",
  isEnabled: true,
  startsAt: null,
  endsAt: null,
  availabilityWindows: [],
  dealBasePrice: 0,
  components: [
    {
      componentId: "component-1",
      label: "Pizza 1",
      sortOrder: 1,
      requiredQuantity: 1,
      minQuantity: 1,
      maxQuantity: 1,
      pricingBehavior: "included_base",
      pricingMode: "fixed_price",
      fixedPrice: 7.99,
      isRequired: true,
      allowedProductIds: ["product-1"],
    },
  ],
}

const componentPricedOrderableDealItem: DealCartItem = {
  cartItemId: "orderable-cart-1",
  itemType: "deal",
  specialType: "orderable_deal",
  usesComponentPricing: true,
  businessId: "business-1",
  businessSlug: "demo",
  locationId: null,
  locationSlug: null,
  specialId: "orderable-special-1",
  specialName: "Two Pizzas and Soda",
  componentBaseTotal: 7.99,
  dealBasePrice: 7.99,
  childExtraTotal: 0,
  totalPrice: 7.99,
  components: [
    {
      componentId: "component-1",
      componentLabel: "Pizza 1",
      sortOrder: 1,
      requiredQuantity: 1,
      selectedQuantity: 1,
      pricingMode: "fixed_price",
      fixedPrice: 7.99,
      componentBaseTotal: 7.99,
      children: [
        {
          childLineId: "orderable-child-1",
          productId: "product-1",
          productName: "Italian Sub",
          variantId: null,
          variantName: null,
          quantity: 1,
          configuredLineTotal: 8.99,
          componentPricingMode: "fixed_price",
          componentFixedPrice: 7.99,
          componentBasePrice: 7.99,
          childExtraTotal: 0,
          modifiers: [],
        },
      ],
    },
  ],
}

describe("validateAndPriceCheckoutItems", () => {
  it("validates and prices Mix & Match deal checkout with server-loaded rules", () => {
    const result = validateAndPriceCheckoutItems({
      items: [mixDealItem],
      products,
      dealsById: new Map(),
      mixAndMatchDealsById: new Map([["mix-special-1", mixDeal]]),
      businessId: "business-1",
      currentTime: new Date("2026-06-08T12:00:00.000Z"),
      timeZone: "America/New_York",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.subtotal).toBe(15.98)
    expect(result.cart.dealItems[0]).toMatchObject({
      specialType: "mix_and_match_fixed_unit_price",
      specialId: "mix-special-1",
      selectedQuantity: 2,
      mixBaseTotal: 15.98,
      childExtraTotal: 0,
      lineSubtotal: 15.98,
    })
    expect(result.cart.normalItems).toHaveLength(0)
  })

  it("rejects stale Mix & Match totals", () => {
    const result = validateAndPriceCheckoutItems({
      items: [{ ...mixDealItem, totalPrice: 1 }],
      products,
      dealsById: new Map(),
      mixAndMatchDealsById: new Map([["mix-special-1", mixDeal]]),
      businessId: "business-1",
      currentTime: new Date("2026-06-08T12:00:00.000Z"),
      timeZone: "America/New_York",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.errors[0]).toMatchObject({
      code: "stale_mix_total",
      cartItemId: "mix-cart-1",
    })
  })

  it("validates fixed-price component orderable deal checkout", () => {
    const result = validateAndPriceCheckoutItems({
      items: [componentPricedOrderableDealItem],
      products,
      dealsById: new Map([["orderable-special-1", orderableDeal]]),
      mixAndMatchDealsById: new Map(),
      businessId: "business-1",
      currentTime: new Date("2026-06-08T12:00:00.000Z"),
      timeZone: "America/New_York",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.subtotal).toBe(7.99)
    expect(result.cart.dealItems[0]).toMatchObject({
      specialType: "orderable_deal",
      specialId: "orderable-special-1",
      dealBasePrice: 7.99,
      componentBaseTotal: 7.99,
      childExtraTotal: 0,
      lineSubtotal: 7.99,
      usesComponentPricing: true,
    })
    expect(result.cart.dealItems[0].components[0].children[0]).toMatchObject({
      componentPricingMode: "fixed_price",
      componentFixedPrice: 7.99,
      componentBasePrice: 7.99,
      childExtraTotal: 0,
    })
  })

  it("rejects unsupported normal-price component orderable deals", () => {
    const result = validateAndPriceCheckoutItems({
      items: [
        {
          ...componentPricedOrderableDealItem,
          totalPrice: 0,
        },
      ],
      products,
      dealsById: new Map([
        [
          "orderable-special-1",
          {
            ...orderableDeal,
            components: [
              {
                ...orderableDeal.components[0],
                pricingMode: "normal_price",
                fixedPrice: null,
              },
            ],
          },
        ],
      ]),
      mixAndMatchDealsById: new Map(),
      businessId: "business-1",
      currentTime: new Date("2026-06-08T12:00:00.000Z"),
      timeZone: "America/New_York",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.errors[0]).toMatchObject({
      code: "unsupported_component_pricing_mode",
      cartItemId: "orderable-cart-1",
    })
  })
})
