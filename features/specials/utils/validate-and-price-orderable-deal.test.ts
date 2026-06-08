import { describe, expect, it } from "vitest"
import {
  validateAndPriceOrderableDeal,
  type OrderableDealCandidate,
  type OrderableDealComponent,
  type OrderableDealSelectedChild,
} from "./validate-and-price-orderable-deal"

const businessId = "business-a"
const currentTime = new Date("2026-06-01T16:30:00.000Z")

const pizzaComponent: OrderableDealComponent = {
  componentId: "component-pizza",
  label: "Choose your pizza",
  sortOrder: 1,
  requiredQuantity: 1,
  minQuantity: 1,
  maxQuantity: 1,
  pricingBehavior: "included_base",
  isRequired: true,
  allowedProductIds: ["pizza-a", "pizza-b"],
}

const breadComponent: OrderableDealComponent = {
  componentId: "component-bread",
  label: "Choose your bread",
  sortOrder: 2,
  requiredQuantity: 1,
  minQuantity: 1,
  maxQuantity: 1,
  pricingBehavior: "included_base",
  isRequired: true,
  allowedProductIds: ["bread-a"],
}

function buildDeal(
  overrides: Partial<OrderableDealCandidate> = {}
): OrderableDealCandidate {
  return {
    businessId,
    specialId: "deal-a",
    name: "Family Deal",
    specialType: "orderable_deal",
    isEnabled: true,
    startsAt: null,
    endsAt: null,
    availabilityWindows: [],
    dealBasePrice: 29.99,
    components: [pizzaComponent],
    ...overrides,
  }
}

function buildChild(
  overrides: Partial<OrderableDealSelectedChild> = {}
): OrderableDealSelectedChild {
  return {
    componentId: "component-pizza",
    childLineId: "child-pizza-a",
    productId: "pizza-a",
    productName: "Deluxe Pizza",
    quantity: 1,
    configuredLineTotal: 18.99,
    basePrice: 16.99,
    childExtraTotal: 0,
    variantName: "Large",
    selectedVariantOptionId: "variant-large",
    ...overrides,
  }
}

function validate({
  deal = buildDeal(),
  children = [buildChild()],
  timeZone = "America/New_York",
}: {
  deal?: OrderableDealCandidate
  children?: OrderableDealSelectedChild[]
  timeZone?: string | null
} = {}) {
  return validateAndPriceOrderableDeal({
    businessId,
    currentTime,
    timeZone,
    deal,
    children,
  })
}

function expectError(
  result: ReturnType<typeof validateAndPriceOrderableDeal>,
  code: string
) {
  expect(result.ok).toBe(false)
  if (result.ok) return

  expect(result.errors.map((error) => error.code)).toContain(code)
}

describe("validateAndPriceOrderableDeal", () => {
  it("prices a simple deal with one required component and one valid child", () => {
    const result = validate()

    expect(result).toEqual({
      ok: true,
      businessId,
      specialId: "deal-a",
      dealName: "Family Deal",
      dealBasePrice: 29.99,
      childExtraTotal: 0,
      total: 29.99,
      warnings: [],
      components: [
        {
          componentId: "component-pizza",
          label: "Choose your pizza",
          sortOrder: 1,
          requiredQuantity: 1,
          minQuantity: 1,
          maxQuantity: 1,
          selectedQuantity: 1,
          pricingBehavior: "included_base",
          children: [
            {
              componentId: "component-pizza",
              childLineId: "child-pizza-a",
              productId: "pizza-a",
              productName: "Deluxe Pizza",
              quantity: 1,
              configuredLineTotal: 18.99,
              basePrice: 16.99,
              childExtraTotal: 0,
              variantName: "Large",
            },
          ],
        },
      ],
    })
  })

  it("supports a family deal with multiple components", () => {
    const result = validate({
      deal: buildDeal({
        components: [breadComponent, pizzaComponent],
      }),
      children: [
        buildChild(),
        buildChild({
          componentId: "component-bread",
          childLineId: "child-bread-a",
          productId: "bread-a",
          productName: "Cheese Bread",
          configuredLineTotal: 6.99,
          basePrice: 6.99,
        }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.components.map((component) => component.label)).toEqual([
      "Choose your pizza",
      "Choose your bread",
    ])
    expect(result.total).toBe(29.99)
  })

  it("supports a two-pizza deal using two separate components", () => {
    const firstPizza = { ...pizzaComponent, componentId: "pizza-1", label: "Pizza 1" }
    const secondPizza = { ...pizzaComponent, componentId: "pizza-2", label: "Pizza 2", sortOrder: 2 }
    const result = validate({
      deal: buildDeal({ components: [secondPizza, firstPizza] }),
      children: [
        buildChild({ componentId: "pizza-1", childLineId: "child-1" }),
        buildChild({ componentId: "pizza-2", childLineId: "child-2" }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.components.map((component) => component.componentId)).toEqual([
      "pizza-1",
      "pizza-2",
    ])
  })

  it("supports a two-pizza deal using one component with required quantity 2", () => {
    const result = validate({
      deal: buildDeal({
        components: [
          {
            ...pizzaComponent,
            requiredQuantity: 2,
            minQuantity: 2,
            maxQuantity: 2,
          },
        ],
      }),
      children: [
        buildChild({ childLineId: "child-1", productId: "pizza-a" }),
        buildChild({ childLineId: "child-2", productId: "pizza-b" }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.components[0].selectedQuantity).toBe(2)
  })

  it("counts selected child lines toward component quantity, not product quantity", () => {
    const result = validate({
      deal: buildDeal({
        components: [
          {
            ...pizzaComponent,
            requiredQuantity: 1,
            minQuantity: 1,
            maxQuantity: 2,
          },
        ],
      }),
      children: [buildChild({ quantity: 2 })],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.components[0].selectedQuantity).toBe(1)
    expect(result.components[0].children[0].quantity).toBe(2)
  })

  it("adds explicit child extras to the deal base price", () => {
    const result = validate({
      children: [
        buildChild({
          childExtraTotal: 3.5,
        }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.childExtraTotal).toBe(3.5)
    expect(result.total).toBe(33.49)
  })

  it("uses modifierExtraTotal when childExtraTotal is not supplied", () => {
    const result = validate({
      children: [
        buildChild({
          childExtraTotal: undefined,
          modifierExtraTotal: 2.25,
        }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.childExtraTotal).toBe(2.25)
  })

  it("uses chargedModifierTotal when no explicit extra fields are supplied", () => {
    const result = validate({
      children: [
        buildChild({
          childExtraTotal: undefined,
          modifierExtraTotal: undefined,
          chargedModifierTotal: 1.75,
        }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.childExtraTotal).toBe(1.75)
  })

  it("treats child extras as zero when no extra field is supplied", () => {
    const result = validate({
      children: [
        buildChild({
          childExtraTotal: undefined,
          modifierExtraTotal: undefined,
          chargedModifierTotal: undefined,
        }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.childExtraTotal).toBe(0)
  })

  it("allows an optional component with min 0", () => {
    const result = validate({
      deal: buildDeal({
        components: [
          {
            componentId: "component-dessert",
            label: "Add dessert",
            sortOrder: 1,
            requiredQuantity: 0,
            minQuantity: 0,
            maxQuantity: 1,
            pricingBehavior: "included_base",
            isRequired: false,
            allowedProductIds: ["dessert-a"],
          },
        ],
      }),
      children: [],
    })

    expect(result.ok).toBe(true)
  })

  it("accepts active scheduled deals with no availability windows inside date range", () => {
    const result = validate({
      deal: buildDeal({
        startsAt: "2026-06-01T00:00:00.000Z",
        endsAt: "2026-06-30T00:00:00.000Z",
        availabilityWindows: [],
      }),
    })

    expect(result.ok).toBe(true)
  })

  it("accepts deals inside a recurring window", () => {
    const result = validate({
      deal: buildDeal({
        availabilityWindows: [
          {
            dayOfWeek: 1,
            startTime: "11:00",
            endTime: "14:00",
            isAllDay: false,
          },
        ],
      }),
    })

    expect(result.ok).toBe(true)
  })

  it("rejects disabled deals", () => {
    expectError(validate({ deal: buildDeal({ isEnabled: false }) }), "disabled_deal")
  })

  it("rejects future deals", () => {
    expectError(
      validate({
        deal: buildDeal({ startsAt: "2026-06-02T00:00:00.000Z" }),
      }),
      "scheduled_deal"
    )
  })

  it("rejects expired deals", () => {
    expectError(
      validate({
        deal: buildDeal({ endsAt: "2026-05-31T23:59:00.000Z" }),
      }),
      "expired_deal"
    )
  })

  it("rejects deals outside a recurring window", () => {
    expectError(
      validate({
        deal: buildDeal({
          availabilityWindows: [
            {
              dayOfWeek: 1,
              startTime: "13:00",
              endTime: "14:00",
              isAllDay: false,
            },
          ],
        }),
      }),
      "inactive_now"
    )
  })

  it("rejects the wrong special type", () => {
    expectError(
      validate({
        deal: buildDeal({ specialType: "cart_discount" }),
      }),
      "wrong_special_type"
    )
  })

  it("rejects deals from another business", () => {
    expectError(
      validate({
        deal: buildDeal({ businessId: "other-business" }),
      }),
      "wrong_business"
    )
  })

  it("rejects unknown child components", () => {
    expectError(
      validate({
        children: [buildChild({ componentId: "missing-component" })],
      }),
      "unknown_component"
    )
  })

  it("rejects missing required components", () => {
    expectError(validate({ children: [] }), "missing_required_component")
  })

  it("rejects below-min optional component selections", () => {
    expectError(
      validate({
        deal: buildDeal({
          components: [
            {
              ...pizzaComponent,
              isRequired: false,
              requiredQuantity: 1,
              minQuantity: 1,
              maxQuantity: 2,
            },
          ],
        }),
        children: [],
      }),
      "below_min_quantity"
    )
  })

  it("rejects above-max component selections", () => {
    expectError(
      validate({
        children: [
          buildChild({ childLineId: "child-1" }),
          buildChild({ childLineId: "child-2" }),
        ],
      }),
      "above_max_quantity"
    )
  })

  it("rejects products that are not allowed for the component", () => {
    expectError(
      validate({
        children: [buildChild({ productId: "not-allowed" })],
      }),
      "product_not_allowed"
    )
  })

  it("allows any selected variant when no variant restrictions exist", () => {
    const result = validate({
      children: [buildChild({ selectedVariantOptionId: "variant-small" })],
    })

    expect(result.ok).toBe(true)
  })

  it("accepts a selected variant that matches the component product restriction", () => {
    const result = validate({
      deal: buildDeal({
        components: [
          {
            ...pizzaComponent,
            allowedProductVariantOptions: [
              {
                productId: "pizza-a",
                allowedVariantOptionIds: ["variant-large"],
              },
            ],
          },
        ],
      }),
      children: [buildChild({ selectedVariantOptionId: "variant-large" })],
    })

    expect(result.ok).toBe(true)
  })

  it("rejects a selected variant outside the component product restriction", () => {
    expectError(
      validate({
        deal: buildDeal({
          components: [
            {
              ...pizzaComponent,
              allowedProductVariantOptions: [
                {
                  productId: "pizza-a",
                  allowedVariantOptionIds: ["variant-large"],
                },
              ],
            },
          ],
        }),
        children: [buildChild({ selectedVariantOptionId: "variant-small" })],
      }),
      "variant_not_allowed"
    )
  })

  it("accepts one of multiple allowed variant restrictions", () => {
    const result = validate({
      deal: buildDeal({
        components: [
          {
            ...pizzaComponent,
            allowedProductVariantOptions: [
              {
                productId: "pizza-a",
                allowedVariantOptionIds: ["variant-large", "variant-xl"],
              },
            ],
          },
        ],
      }),
      children: [buildChild({ selectedVariantOptionId: "variant-xl" })],
    })

    expect(result.ok).toBe(true)
  })

  it("does not let another product's variant restriction allow this product", () => {
    expectError(
      validate({
        deal: buildDeal({
          components: [
            {
              ...pizzaComponent,
              allowedProductVariantOptions: [
                {
                  productId: "pizza-b",
                  allowedVariantOptionIds: ["variant-large"],
                },
                {
                  productId: "pizza-a",
                  allowedVariantOptionIds: ["variant-small"],
                },
              ],
            },
          ],
        }),
        children: [buildChild({ selectedVariantOptionId: "variant-large" })],
      }),
      "variant_not_allowed"
    )
  })

  it("rejects negative base prices", () => {
    expectError(
      validate({
        deal: buildDeal({ dealBasePrice: -1 }),
      }),
      "invalid_base_price"
    )
  })

  it("rejects negative child extras", () => {
    expectError(
      validate({
        children: [buildChild({ childExtraTotal: -1 })],
      }),
      "negative_child_extra"
    )
  })

  it("rejects invalid child quantities", () => {
    expectError(
      validate({
        children: [buildChild({ quantity: 0 })],
      }),
      "invalid_child_quantity"
    )
  })

  it("rejects invalid component quantity rules", () => {
    expectError(
      validate({
        deal: buildDeal({
          components: [
            {
              ...pizzaComponent,
              minQuantity: 2,
              maxQuantity: 1,
            },
          ],
        }),
      }),
      "invalid_component_quantity_rule"
    )
  })
})
