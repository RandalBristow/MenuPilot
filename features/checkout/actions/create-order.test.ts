import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ConfiguredCartItem } from "@/features/cart/types/cart"
import type { CheckoutTenantContext } from "@/features/checkout/utils/checkout-tenant-context"
import type { CheckoutProductConfig } from "@/features/checkout/utils/validate-and-price-cart"
import type { SpecialCandidate } from "@/features/specials/types/special"
import type { MixAndMatchDealCandidate } from "@/features/specials/utils/validate-and-price-mix-and-match-deal"
import type { OrderableDealCandidate } from "@/features/specials/utils/validate-and-price-orderable-deal"
import { createOrder } from "./create-order"

const resolverMock = vi.hoisted(() => ({
  context: null as CheckoutTenantContext | null,
  calls: [] as unknown[],
}))

const checkoutProductMock = vi.hoisted(() => ({
  products: [
    {
      id: "product-a",
      name: "Server Pizza",
      isEnabled: true,
      basePrice: 12,
    },
  ] as CheckoutProductConfig[],
  calls: [] as unknown[],
}))

const specialsMock = vi.hoisted(() => ({
  specials: [] as SpecialCandidate[],
  calls: [] as unknown[],
}))

const dealsMock = vi.hoisted(() => ({
  dealsById: new Map<string, OrderableDealCandidate>(),
  calls: [] as unknown[],
}))

const mixDealsMock = vi.hoisted(() => ({
  dealsById: new Map<string, MixAndMatchDealCandidate>(),
  calls: [] as unknown[],
}))

const supabaseMock = vi.hoisted(() => ({
  inserts: [] as { table: string; payload: unknown }[],
  orderItemIds: ["order-item-a"] as string[],
}))

vi.mock("@/features/checkout/utils/resolve-checkout-tenant-context", () => ({
  resolveCheckoutTenantContext: (input: unknown) => {
    resolverMock.calls.push(input)
    return Promise.resolve(resolverMock.context)
  },
}))

vi.mock("@/features/checkout/queries/load-checkout-product-config", () => ({
  loadCheckoutProductConfig: (input: unknown) => {
    checkoutProductMock.calls.push(input)
    return Promise.resolve(checkoutProductMock.products)
  },
}))

vi.mock("@/features/specials/queries/load-active-specials-for-checkout", () => ({
  loadActiveSpecialsForCheckout: (input: unknown) => {
    specialsMock.calls.push(input)
    return Promise.resolve(specialsMock.specials)
  },
}))

vi.mock("@/features/specials/queries/load-orderable-deals-for-checkout", () => ({
  loadOrderableDealsForCheckout: (input: unknown) => {
    dealsMock.calls.push(input)
    return Promise.resolve(dealsMock.dealsById)
  },
}))

vi.mock("@/features/specials/queries/load-mix-and-match-deals-for-checkout", () => ({
  loadMixAndMatchDealsForCheckout: (input: unknown) => {
    mixDealsMock.calls.push(input)
    return Promise.resolve(mixDealsMock.dealsById)
  },
}))

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: (table: string) => ({
      insert(payload: unknown) {
        supabaseMock.inserts.push({ table, payload })

        return {
          select() {
            return {
              single() {
                if (table === "orders") {
                  return Promise.resolve({
                    data: {
                      id: "order-a",
                      order_number: "MP-123",
                    },
                    error: null,
                  })
                }

                return Promise.resolve({
                  data: {
                    id: supabaseMock.orderItemIds.shift() ?? "order-item-a",
                  },
                  error: null,
                })
              },
            }
          },
          then(resolve: (value: { error: null }) => void) {
            resolve({ error: null })
          },
        }
      },
    }),
  },
}))

function lineDiscount(
  overrides: Partial<SpecialCandidate> = {}
): SpecialCandidate {
  return {
    id: "line-special",
    businessId: "business-a",
    name: "Line Special",
    specialType: "line_discount",
    discountType: "percentage",
    discountValue: 25,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    isEnabled: true,
    eligibleProducts: [{ productId: "product-a" }],
    eligibleMenuGroupIds: [],
    ...overrides,
  }
}

function fixedPriceLine(
  overrides: Partial<SpecialCandidate> = {}
): SpecialCandidate {
  return {
    id: "fixed-price-special",
    businessId: "business-a",
    name: "Fixed Price Special",
    specialType: "fixed_price_line",
    discountType: "fixed_price",
    discountValue: 8,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    isEnabled: true,
    eligibleProducts: [{ productId: "product-a" }],
    eligibleMenuGroupIds: [],
    ...overrides,
  }
}

function cartDiscount(
  overrides: Partial<SpecialCandidate> = {}
): SpecialCandidate {
  return {
    id: "cart-special",
    businessId: "business-a",
    name: "Cart Special",
    specialType: "cart_discount",
    discountType: "fixed_amount",
    discountValue: 5,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    isEnabled: true,
    eligibleProducts: [],
    eligibleMenuGroupIds: [],
    ...overrides,
  }
}

function orderableDeal(
  overrides: Partial<OrderableDealCandidate> = {}
): OrderableDealCandidate {
  return {
    businessId: "business-a",
    specialId: "deal-1",
    name: "Family Deal",
    specialType: "orderable_deal",
    isEnabled: true,
    startsAt: null,
    endsAt: null,
    availabilityWindows: [],
    dealBasePrice: 24.99,
    components: [
      {
        componentId: "component-1",
        label: "Choose a pizza",
        sortOrder: 1,
        requiredQuantity: 1,
        minQuantity: 1,
        maxQuantity: 1,
        pricingBehavior: "included_base",
        isRequired: true,
        allowedProductIds: ["product-a"],
      },
    ],
    ...overrides,
  }
}

function mixAndMatchDeal(
  overrides: Partial<MixAndMatchDealCandidate> = {}
): MixAndMatchDealCandidate {
  return {
    businessId: "business-a",
    specialId: "mix-1",
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
    poolProducts: [{ productId: "product-a" }],
    ...overrides,
  }
}

function buildTenantContext(
  overrides: Partial<CheckoutTenantContext> = {}
): CheckoutTenantContext {
  return {
    isLegacyDemo: false,
    business: {
      id: "business-a",
      slug: "business-a",
      name: "Business A",
      status: "active",
      primaryContactName: null,
      primaryContactEmail: null,
      primaryPhone: null,
      isActive: true,
      isSetup: false,
      isPaused: false,
      isArchived: false,
    },
    location: {
      id: "location-a",
      businessId: "business-a",
      slug: "main",
      name: "Main",
      status: "active",
      isEnabled: true,
      acceptingOrders: true,
      pickupEnabled: true,
      deliveryEnabled: false,
      timezone: "America/New_York",
      isActive: true,
      isSetup: false,
    },
    ...overrides,
  }
}

function buildCartItem(
  overrides: Partial<ConfiguredCartItem> = {}
): ConfiguredCartItem {
  return {
    cartItemId: "cart-a",
    businessId: "business-a",
    businessSlug: "business-a",
    productId: "product-a",
    productName: "Client Pizza",
    variantId: null,
    variantName: null,
    quantity: 1,
    unitPrice: 1,
    totalPrice: 1,
    modifiers: [],
    ...overrides,
  }
}

function buildDealCartItem({
  childVariantId = "variant-large",
  childVariantName = "Large",
  configuredLineTotal = 14,
  childQuantity = 1,
  childExtraTotal = 2,
  totalPrice = 26.99,
  modifiers = [
    {
      optionId: "pepperoni",
      optionName: "Pepperoni",
      groupId: "toppings",
      groupName: "Toppings",
      placement: "whole" as const,
      multiplier: 1,
      priceDelta: 2,
    },
  ],
}: {
  childVariantId?: string | null
  childVariantName?: string | null
  configuredLineTotal?: number
  childQuantity?: number
  childExtraTotal?: number
  totalPrice?: number
  modifiers?: ConfiguredCartItem["modifiers"]
} = {}) {
  return {
    cartItemId: "deal-cart-1",
    itemType: "deal" as const,
    businessId: "business-a",
    businessSlug: "business-a",
    locationId: null,
    locationSlug: null,
    specialId: "deal-1",
    specialName: "Family Deal",
    dealBasePrice: 24.99,
    childExtraTotal,
    totalPrice,
    components: [
      {
        componentId: "component-1",
        componentLabel: "Choose a pizza",
        sortOrder: 1,
        requiredQuantity: 1,
        selectedQuantity: 1,
        children: [
          {
            childLineId: "child-1",
            productId: "product-a",
            productName: "Client Pizza",
            variantId: childVariantId,
            variantName: childVariantName,
            quantity: childQuantity,
            configuredLineTotal,
            childExtraTotal,
            modifiers,
          },
        ],
      },
    ],
  }
}

function buildMixCartItem({
  configuredLineTotal = 24,
  childQuantity = 2,
  childExtraTotal = 0,
  totalPrice = 15.98,
}: {
  configuredLineTotal?: number
  childQuantity?: number
  childExtraTotal?: number
  totalPrice?: number
} = {}) {
  return {
    cartItemId: "mix-cart-1",
    itemType: "deal" as const,
    specialType: "mix_and_match_fixed_unit_price" as const,
    businessId: "business-a",
    businessSlug: "business-a",
    locationId: null,
    locationSlug: null,
    specialId: "mix-1",
    specialName: "Any 2 Subs",
    ruleSummary: "Any 2+ for $7.99 each",
    selectedQuantity: childQuantity,
    unitPrice: 7.99,
    mixBaseTotal: totalPrice,
    dealBasePrice: totalPrice,
    childExtraTotal,
    totalPrice,
    components: [
      {
        componentId: "mix:mix-1",
        componentLabel: "Mix & Match selections",
        sortOrder: 1,
        requiredQuantity: 2,
        selectedQuantity: childQuantity,
        children: [
          {
            childLineId: "mix-child-1",
            productId: "product-a",
            productName: "Client Sub",
            variantId: null,
            variantName: null,
            quantity: childQuantity,
            configuredLineTotal,
            childExtraTotal,
            modifiers: [],
          },
        ],
      },
    ],
  }
}

function buildInput(overrides: Partial<Parameters<typeof createOrder>[0]> = {}) {
  return {
    customerName: "Jane",
    customerPhone: "555-1212",
    fulfillmentType: "pickup" as const,
    items: [buildCartItem()],
    businessSlug: "business-a",
    ...overrides,
  }
}

function enableDealProductVariants() {
  checkoutProductMock.products = checkoutProductMock.products.map((product) =>
    product.id === "product-a"
      ? {
          ...product,
          variants: [
            {
              id: "variant-large",
              name: "Large",
              basePrice: 12,
              isEnabled: true,
            },
            {
              id: "variant-small",
              name: "Small",
              basePrice: 12,
              isEnabled: true,
            },
          ],
        }
      : product
  )
}

describe("createOrder tenant checkout", () => {
  beforeEach(() => {
    resolverMock.context = buildTenantContext()
    resolverMock.calls = []
    checkoutProductMock.products = [
      {
        id: "product-a",
        name: "Server Pizza",
        isEnabled: true,
        basePrice: 12,
        modifierGroups: [
          {
            id: "toppings",
            name: "Toppings",
            isAssignmentEnabled: true,
            isEnabled: true,
            isRequired: false,
            minRequired: 0,
            maxAllowed: null,
            supportsPlacement: false,
            supportsMultiplier: false,
            options: [
              {
                id: "pepperoni",
                name: "Pepperoni",
                priceDelta: 2,
                isEnabled: true,
                optionGroup: null,
              },
            ],
          },
        ],
      },
    ]
    checkoutProductMock.calls = []
    specialsMock.specials = []
    specialsMock.calls = []
    dealsMock.dealsById = new Map()
    dealsMock.calls = []
    mixDealsMock.dealsById = new Map()
    mixDealsMock.calls = []
    supabaseMock.inserts = []
    supabaseMock.orderItemIds = ["order-item-a"]
  })

  it("passes supplied business slug to tenant resolution", async () => {
    await createOrder(buildInput({ businessSlug: "business-a" }))

    expect(resolverMock.calls[0]).toEqual({
      businessSlug: "business-a",
      locationSlug: undefined,
    })
  })

  it("uses legacy demo fallback when no business slug is supplied", async () => {
    resolverMock.context = buildTenantContext({ isLegacyDemo: true })

    await createOrder(
      buildInput({
        businessSlug: undefined,
        items: [buildCartItem({ businessId: undefined, businessSlug: undefined })],
      })
    )

    expect(resolverMock.calls[0]).toEqual({
      businessSlug: undefined,
      locationSlug: undefined,
    })
  })

  it("blocks setup businesses before inserting an order", async () => {
    resolverMock.context = buildTenantContext({
      business: {
        ...buildTenantContext().business,
        status: "setup",
        isActive: false,
        isSetup: true,
      },
    })

    const result = await createOrder(buildInput())

    expect(result.ok).toBe(false)
    expect(supabaseMock.inserts).toHaveLength(0)
  })

  it("rejects cross-tenant carts before inserting an order", async () => {
    const result = await createOrder(
      buildInput({ items: [buildCartItem({ businessId: "business-b" })] })
    )

    expect(result.ok).toBe(false)
    expect(result.ok ? "" : result.error).toMatch(/another business/i)
    expect(supabaseMock.inserts).toHaveLength(0)
  })

  it("loads product config with selected business id and inserts resolved ids", async () => {
    const result = await createOrder(buildInput())

    expect(result).toMatchObject({
      ok: true,
      orderId: "order-a",
      orderNumber: "MP-123",
    })
    expect(checkoutProductMock.calls[0]).toEqual({
      businessId: "business-a",
      productIds: ["product-a"],
    })
    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        business_id: "business-a",
        location_id: "location-a",
        subtotal: 12,
        discount_total: 0,
        total: 12,
      },
    })
  })

  it("loads active specials with selected business id", async () => {
    await createOrder(buildInput())

    expect(specialsMock.calls[0]).toMatchObject({
      businessId: "business-a",
      currentTime: expect.any(Date),
      timeZone: "America/New_York",
    })
  })

  it("keeps discount total zero and inserts no discount snapshots with no specials", async () => {
    await createOrder(buildInput())

    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        discount_total: 0,
        total: 12,
      },
    })
    expect(
      supabaseMock.inserts.some((insert) => insert.table === "order_discounts")
    ).toBe(false)
  })

  it("applies an enabled active product line discount after server pricing", async () => {
    specialsMock.specials = [lineDiscount()]

    await createOrder(buildInput())

    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        subtotal: 12,
        discount_total: 3,
        total: 9,
      },
    })
  })

  it("applies a fixed-price line special and writes discount total", async () => {
    specialsMock.specials = [fixedPriceLine()]

    await createOrder(buildInput())

    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        subtotal: 12,
        discount_total: 4,
        total: 8,
      },
    })
  })

  it("applies a cart discount when min order amount passes", async () => {
    specialsMock.specials = [cartDiscount({ minOrderAmount: 10 })]

    await createOrder(buildInput())

    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        discount_total: 5,
        total: 7,
      },
    })
  })

  it("does not apply a cart discount when min order amount fails", async () => {
    specialsMock.specials = [cartDiscount({ minOrderAmount: 20 })]

    await createOrder(buildInput())

    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        discount_total: 0,
        total: 12,
      },
    })
  })

  it("ignores disabled specials", async () => {
    specialsMock.specials = [lineDiscount({ isEnabled: false })]

    await createOrder(buildInput())

    expect(supabaseMock.inserts[0]).toMatchObject({
      payload: {
        discount_total: 0,
        total: 12,
      },
    })
  })

  it("ignores expired and not-yet-started specials", async () => {
    specialsMock.specials = [
      lineDiscount({
        id: "future",
        startsAt: "2999-01-01T00:00:00.000Z",
      }),
      lineDiscount({
        id: "expired",
        endsAt: "2000-01-01T00:00:00.000Z",
      }),
    ]

    await createOrder(buildInput())

    expect(supabaseMock.inserts[0]).toMatchObject({
      payload: {
        discount_total: 0,
        total: 12,
      },
    })
  })

  it("ignores wrong-business specials", async () => {
    specialsMock.specials = [lineDiscount({ businessId: "business-b" })]

    await createOrder(buildInput())

    expect(supabaseMock.inserts[0]).toMatchObject({
      payload: {
        discount_total: 0,
        total: 12,
      },
    })
  })

  it("uses the best special when multiple specials are eligible", async () => {
    specialsMock.specials = [
      lineDiscount({ discountValue: 10 }),
      cartDiscount({ discountValue: 5 }),
    ]

    await createOrder(buildInput())

    expect(supabaseMock.inserts[0]).toMatchObject({
      payload: {
        discount_total: 5,
        total: 7,
      },
    })
    expect(
      supabaseMock.inserts.find((insert) => insert.table === "order_discounts")
    ).toMatchObject({
      payload: [
        expect.objectContaining({
          special_id: "cart-special",
        }),
      ],
    })
  })

  it("still ignores stale/tampered client prices before applying specials", async () => {
    specialsMock.specials = [lineDiscount()]

    await createOrder(
      buildInput({
        items: [
          buildCartItem({
            unitPrice: 999,
            totalPrice: 999,
          }),
        ],
      })
    )

    expect(supabaseMock.inserts[0]).toMatchObject({
      payload: {
        subtotal: 12,
        discount_total: 3,
        total: 9,
      },
    })
  })

  it("accepts a valid orderable deal and inserts parent and child order items", async () => {
    enableDealProductVariants()
    dealsMock.dealsById = new Map([["deal-1", orderableDeal()]])
    supabaseMock.orderItemIds = ["deal-parent-item", "deal-child-item"]

    const result = await createOrder(
      buildInput({ items: [buildDealCartItem()] })
    )

    expect(result.ok).toBe(true)
    expect(dealsMock.calls[0]).toMatchObject({
      businessId: "business-a",
      specialIds: ["deal-1"],
      timeZone: "America/New_York",
    })
    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        subtotal: 26.99,
        discount_total: 0,
        total: 26.99,
      },
    })
    expect(supabaseMock.inserts[1]).toMatchObject({
      table: "order_items",
      payload: {
        product_id: null,
        product_name_snapshot: "Family Deal",
        relationship_type: "deal",
        line_subtotal: 26.99,
      },
    })
    expect(supabaseMock.inserts[2]).toMatchObject({
      table: "order_items",
      payload: {
        parent_order_item_id: "deal-parent-item",
        relationship_type: "deal_component",
        product_id: "product-a",
        product_name_snapshot: "Server Pizza",
        line_subtotal: 2,
      },
    })
    expect(supabaseMock.inserts[3]).toMatchObject({
      table: "order_item_modifiers",
      payload: [
        expect.objectContaining({
          order_item_id: "deal-child-item",
          modifier_option_id: "pepperoni",
        }),
      ],
    })
    expect(
      supabaseMock.inserts.some((insert) => insert.table === "order_discounts")
    ).toBe(false)
  })

  it("accepts a valid Mix & Match deal and inserts parent and child order items", async () => {
    mixDealsMock.dealsById = new Map([["mix-1", mixAndMatchDeal()]])
    supabaseMock.orderItemIds = ["mix-parent-item", "mix-child-item"]

    const result = await createOrder(
      buildInput({ items: [buildMixCartItem()] })
    )

    expect(result.ok).toBe(true)
    expect(dealsMock.calls[0]).toMatchObject({
      businessId: "business-a",
      specialIds: [],
      timeZone: "America/New_York",
    })
    expect(mixDealsMock.calls[0]).toMatchObject({
      businessId: "business-a",
      specialIds: ["mix-1"],
      timeZone: "America/New_York",
    })
    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        subtotal: 15.98,
        discount_total: 0,
        total: 15.98,
      },
    })
    expect(supabaseMock.inserts[1]).toMatchObject({
      table: "order_items",
      payload: {
        product_id: null,
        product_name_snapshot: "Any 2 Subs",
        relationship_type: "deal",
        line_subtotal: 15.98,
      },
    })
    expect(supabaseMock.inserts[1].payload).toMatchObject({
      notes: expect.stringContaining("mix_and_match_fixed_unit_price"),
    })
    expect(supabaseMock.inserts[2]).toMatchObject({
      table: "order_items",
      payload: {
        parent_order_item_id: "mix-parent-item",
        relationship_type: "deal_component",
        product_id: "product-a",
        product_name_snapshot: "Server Pizza",
        quantity: 2,
        line_subtotal: 0,
      },
    })
    expect(
      supabaseMock.inserts.some((insert) => insert.table === "order_discounts")
    ).toBe(false)
  })

  it("charges extra deal child quantity beyond the first included unit", async () => {
    enableDealProductVariants()
    dealsMock.dealsById = new Map([["deal-1", orderableDeal()]])
    supabaseMock.orderItemIds = ["deal-parent-item", "deal-child-item"]

    const result = await createOrder(
      buildInput({
        items: [
          buildDealCartItem({
            childQuantity: 2,
            configuredLineTotal: 24,
            childExtraTotal: 12,
            totalPrice: 36.99,
            modifiers: [],
          }),
        ],
      })
    )

    expect(result.ok).toBe(true)
    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        subtotal: 36.99,
        total: 36.99,
      },
    })
    expect(supabaseMock.inserts[1]).toMatchObject({
      table: "order_items",
      payload: {
        relationship_type: "deal",
        line_subtotal: 36.99,
      },
    })
    expect(supabaseMock.inserts[2]).toMatchObject({
      table: "order_items",
      payload: {
        relationship_type: "deal_component",
        quantity: 2,
        line_subtotal: 12,
      },
    })
  })

  it("prices deal child modifiers with component included-count overrides", async () => {
    enableDealProductVariants()
    checkoutProductMock.products = checkoutProductMock.products.map((product) =>
      product.id === "product-a"
        ? {
            ...product,
            modifierGroups: [
              {
                ...product.modifierGroups![0],
                includedQuantity: 0,
                chargeForExtra: true,
                options: [
                  ...product.modifierGroups![0].options,
                  {
                    id: "sausage",
                    name: "Sausage",
                    priceDelta: 2,
                    isEnabled: true,
                    optionGroup: null,
                  },
                ],
              },
            ],
          }
        : product
    )
    dealsMock.dealsById = new Map([
      [
        "deal-1",
        orderableDeal({
          components: [
            {
              componentId: "component-1",
              label: "Choose a pizza",
              sortOrder: 1,
              requiredQuantity: 1,
              minQuantity: 1,
              maxQuantity: 1,
              pricingBehavior: "included_base",
              isRequired: true,
              allowedProductIds: ["product-a"],
              modifierGroupOverrides: [
                {
                  productId: "product-a",
                  modifierGroupId: "toppings",
                  includedSelectionCount: 2,
                },
              ],
            },
          ],
        }),
      ],
    ])
    supabaseMock.orderItemIds = ["deal-parent-item", "deal-child-item"]

    const result = await createOrder(
      buildInput({
        items: [
          buildDealCartItem({
            configuredLineTotal: 12,
            childExtraTotal: 0,
            totalPrice: 24.99,
            modifiers: [
              {
                optionId: "pepperoni",
                optionName: "Pepperoni",
                groupId: "toppings",
                groupName: "Toppings",
                placement: "whole",
                multiplier: 1,
                priceDelta: 0,
              },
              {
                optionId: "sausage",
                optionName: "Sausage",
                groupId: "toppings",
                groupName: "Toppings",
                placement: "whole",
                multiplier: 1,
                priceDelta: 0,
              },
            ],
          }),
        ],
      })
    )

    expect(result.ok).toBe(true)
    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        subtotal: 24.99,
        total: 24.99,
      },
    })
    expect(supabaseMock.inserts[2]).toMatchObject({
      table: "order_items",
      payload: {
        relationship_type: "deal_component",
        line_subtotal: 0,
      },
    })
  })

  it("rejects orderable deal child variants outside component restrictions", async () => {
    enableDealProductVariants()
    dealsMock.dealsById = new Map([
      [
        "deal-1",
        orderableDeal({
          components: [
            {
              componentId: "component-1",
              label: "Choose a pizza",
              sortOrder: 1,
              requiredQuantity: 1,
              minQuantity: 1,
              maxQuantity: 1,
              pricingBehavior: "included_base",
              isRequired: true,
              allowedProductIds: ["product-a"],
              allowedProductVariantOptions: [
                {
                  productId: "product-a",
                  allowedVariantOptionIds: ["variant-large"],
                },
              ],
            },
          ],
        }),
      ],
    ])

    const result = await createOrder(
      buildInput({
        items: [
          buildDealCartItem({
            childVariantId: "variant-small",
            childVariantName: "Small",
          }),
        ],
      })
    )

    expect(result.ok).toBe(false)
    expect(result.ok ? "" : result.error).toMatch(/variant.*not allowed/i)
    expect(supabaseMock.inserts).toHaveLength(0)
  })

  it("rejects stale orderable deal totals", async () => {
    enableDealProductVariants()
    dealsMock.dealsById = new Map([["deal-1", orderableDeal()]])

    const result = await createOrder(
      buildInput({
        items: [
          {
            ...buildDealCartItem(),
            totalPrice: 1,
          },
        ],
      })
    )

    expect(result.ok).toBe(false)
    expect(result.ok ? "" : result.error).toMatch(/changed/i)
    expect(supabaseMock.inserts).toHaveLength(0)
  })

  it("applies passive specials only to normal items in a mixed cart", async () => {
    enableDealProductVariants()
    dealsMock.dealsById = new Map([["deal-1", orderableDeal()]])
    specialsMock.specials = [lineDiscount()]
    supabaseMock.orderItemIds = [
      "normal-order-item",
      "deal-parent-item",
      "deal-child-item",
    ]

    await createOrder(
      buildInput({
        items: [
          buildCartItem({
            variantId: "variant-large",
            variantName: "Large",
          }),
          buildDealCartItem(),
        ],
      })
    )

    expect(supabaseMock.inserts[0]).toMatchObject({
      table: "orders",
      payload: {
        subtotal: 38.99,
        discount_total: 3,
        total: 35.99,
      },
    })
    expect(
      supabaseMock.inserts.find((insert) => insert.table === "order_discounts")
    ).toMatchObject({
      payload: [
        expect.objectContaining({
          order_item_id: "normal-order-item",
          special_id: "line-special",
        }),
      ],
    })
  })

  it("maps line discount snapshots to inserted order item id", async () => {
    specialsMock.specials = [lineDiscount()]
    supabaseMock.orderItemIds = ["inserted-order-item"]

    await createOrder(buildInput())

    expect(
      supabaseMock.inserts.find((insert) => insert.table === "order_discounts")
    ).toEqual({
      table: "order_discounts",
      payload: [
        {
          business_id: "business-a",
          order_id: "order-a",
          order_item_id: "inserted-order-item",
          special_id: "line-special",
          name_snapshot: "Line Special",
          special_type_snapshot: "line_discount",
          discount_type_snapshot: "percentage",
          discount_value_snapshot: 25,
          amount: 3,
          coupon_code_snapshot: null,
        },
      ],
    })
  })

  it("inserts cart discount snapshot with null order item id", async () => {
    specialsMock.specials = [cartDiscount()]

    await createOrder(buildInput())

    expect(
      supabaseMock.inserts.find((insert) => insert.table === "order_discounts")
    ).toMatchObject({
      table: "order_discounts",
      payload: [
        expect.objectContaining({
          order_item_id: null,
          special_id: "cart-special",
          special_type_snapshot: "cart_discount",
          amount: 5,
        }),
      ],
    })
  })

  it("keeps legacy checkout working with demo fallback specials", async () => {
    resolverMock.context = buildTenantContext({ isLegacyDemo: true })
    specialsMock.specials = [cartDiscount()]

    const result = await createOrder(
      buildInput({
        businessSlug: undefined,
        items: [buildCartItem({ businessId: undefined, businessSlug: undefined })],
      })
    )

    expect(result.ok).toBe(true)
    expect(specialsMock.calls[0]).toMatchObject({
      businessId: "business-a",
    })
    expect(supabaseMock.inserts[0]).toMatchObject({
      payload: {
        discount_total: 5,
        total: 7,
      },
    })
  })

  it("uses selected scoped business specials", async () => {
    resolverMock.context = buildTenantContext({
      business: {
        ...buildTenantContext().business,
        id: "business-scoped",
        slug: "randys-pizza",
      },
      location: {
        ...buildTenantContext().location,
        id: "location-scoped",
        businessId: "business-scoped",
      },
    })
    checkoutProductMock.products = [
      {
        id: "product-a",
        name: "Server Pizza",
        isEnabled: true,
        basePrice: 12,
      },
    ]
    specialsMock.specials = [
      cartDiscount({
        businessId: "business-scoped",
        discountValue: 4,
      }),
    ]

    await createOrder(
      buildInput({
        businessSlug: "randys-pizza",
        items: [
          buildCartItem({
            businessId: "business-scoped",
            businessSlug: "randys-pizza",
          }),
        ],
      })
    )

    expect(specialsMock.calls[0]).toMatchObject({
      businessId: "business-scoped",
    })
    expect(supabaseMock.inserts[0]).toMatchObject({
      payload: {
        business_id: "business-scoped",
        discount_total: 4,
        total: 8,
      },
    })
  })
})
