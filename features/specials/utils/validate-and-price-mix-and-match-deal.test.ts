import { describe, expect, it } from "vitest"
import {
  validateAndPriceMixAndMatchDeal,
  type MixAndMatchDealCandidate,
  type MixAndMatchSelectedChild,
} from "./validate-and-price-mix-and-match-deal"

const businessId = "business-a"
const currentTime = new Date("2026-06-01T16:30:00.000Z")

function buildDeal(
  overrides: Partial<MixAndMatchDealCandidate> = {}
): MixAndMatchDealCandidate {
  return {
    businessId,
    specialId: "mix-a",
    name: "Any 2 Pizzas",
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
    poolProducts: [
      {
        productId: "pizza-a",
      },
      {
        productId: "pizza-b",
        allowedVariantOptionIds: ["variant-large"],
        modifierGroupOverrides: [
          {
            modifierGroupId: "modifier-toppings",
            includedSelectionCount: 2,
          },
        ],
      },
    ],
    ...overrides,
  }
}

function buildChild(
  overrides: Partial<MixAndMatchSelectedChild> = {}
): MixAndMatchSelectedChild {
  return {
    childLineId: "child-pizza-a",
    productId: "pizza-a",
    productName: "Deluxe Pizza",
    quantity: 1,
    configuredLineTotal: 18.99,
    childExtraTotal: 0,
    selectedVariantOptionId: "variant-small",
    variantName: "Small",
    ...overrides,
  }
}

function validate({
  deal = buildDeal(),
  children = [
    buildChild({ childLineId: "child-a", productId: "pizza-a" }),
    buildChild({
      childLineId: "child-b",
      productId: "pizza-b",
      productName: "Meat Pizza",
      selectedVariantOptionId: "variant-large",
      variantName: "Large",
    }),
  ],
  timeZone = "America/New_York",
}: {
  deal?: MixAndMatchDealCandidate
  children?: MixAndMatchSelectedChild[]
  timeZone?: string | null
} = {}) {
  return validateAndPriceMixAndMatchDeal({
    businessId,
    currentTime,
    timeZone,
    deal,
    children,
  })
}

function expectError(
  result: ReturnType<typeof validateAndPriceMixAndMatchDeal>,
  code: string
) {
  expect(result.ok).toBe(false)
  if (result.ok) return

  expect(result.errors.map((error) => error.code)).toContain(code)
}

describe("validateAndPriceMixAndMatchDeal", () => {
  it("prices Any 2 for $7.99 each with two items", () => {
    const result = validate()

    expect(result).toEqual({
      ok: true,
      businessId,
      specialId: "mix-a",
      dealName: "Any 2 Pizzas",
      minQuantity: 2,
      maxQuantity: null,
      unitPrice: 7.99,
      selectedQuantity: 2,
      mixBaseTotal: 15.98,
      childExtraTotal: 0,
      total: 15.98,
      warnings: [],
      children: [
        {
          childLineId: "child-a",
          productId: "pizza-a",
          productName: "Deluxe Pizza",
          quantity: 1,
          selectedVariantOptionId: "variant-small",
          variantName: "Small",
          configuredLineTotal: 18.99,
          childExtraTotal: 0,
        },
        {
          childLineId: "child-b",
          productId: "pizza-b",
          productName: "Meat Pizza",
          quantity: 1,
          selectedVariantOptionId: "variant-large",
          variantName: "Large",
          configuredLineTotal: 18.99,
          childExtraTotal: 0,
        },
      ],
    })
  })

  it("prices Any 2+ for $7.99 each with three items", () => {
    const result = validate({
      children: [
        buildChild({ childLineId: "child-a", productId: "pizza-a" }),
        buildChild({
          childLineId: "child-b",
          productId: "pizza-b",
          productName: "Meat Pizza",
          selectedVariantOptionId: "variant-large",
        }),
        buildChild({ childLineId: "child-c", productId: "pizza-a" }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.selectedQuantity).toBe(3)
    expect(result.mixBaseTotal).toBe(23.97)
    expect(result.total).toBe(23.97)
  })

  it("allows exactly the configured max quantity", () => {
    const result = validate({
      deal: buildDeal({
        rule: {
          minQuantity: 2,
          maxQuantity: 3,
          unitPrice: 7.99,
          allowExtraItems: true,
        },
      }),
      children: [
        buildChild({ childLineId: "child-a", productId: "pizza-a" }),
        buildChild({
          childLineId: "child-b",
          productId: "pizza-b",
          selectedVariantOptionId: "variant-large",
        }),
        buildChild({ childLineId: "child-c", productId: "pizza-a" }),
      ],
    })

    expect(result.ok).toBe(true)
  })

  it("allows more than minimum with no max when extras are allowed", () => {
    const result = validate({
      children: [
        buildChild({ childLineId: "child-a", productId: "pizza-a" }),
        buildChild({
          childLineId: "child-b",
          productId: "pizza-b",
          selectedVariantOptionId: "variant-large",
        }),
        buildChild({ childLineId: "child-c", productId: "pizza-a" }),
        buildChild({ childLineId: "child-d", productId: "pizza-a" }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.selectedQuantity).toBe(4)
  })

  it("counts child quantity 2 as two selections", () => {
    const result = validate({
      children: [buildChild({ quantity: 2 })],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.selectedQuantity).toBe(2)
    expect(result.mixBaseTotal).toBe(15.98)
  })

  it("adds supplied child extras to selected quantity times unit price", () => {
    const result = validate({
      children: [
        buildChild({ childLineId: "child-a", productId: "pizza-a", childExtraTotal: 1.5 }),
        buildChild({
          childLineId: "child-b",
          productId: "pizza-b",
          productName: "Meat Pizza",
          selectedVariantOptionId: "variant-large",
          childExtraTotal: 2.25,
        }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.mixBaseTotal).toBe(15.98)
    expect(result.childExtraTotal).toBe(3.75)
    expect(result.total).toBe(19.73)
  })

  it("uses modifierExtraTotal or chargedModifierTotal when childExtraTotal is absent", () => {
    const result = validate({
      children: [
        buildChild({
          childLineId: "child-a",
          productId: "pizza-a",
          childExtraTotal: undefined,
          modifierExtraTotal: 1.25,
        }),
        buildChild({
          childLineId: "child-b",
          productId: "pizza-b",
          selectedVariantOptionId: "variant-large",
          childExtraTotal: undefined,
          modifierExtraTotal: undefined,
          chargedModifierTotal: 1.75,
        }),
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.childExtraTotal).toBe(3)
    expect(result.total).toBe(18.98)
  })

  it("treats missing child extras as zero", () => {
    const result = validate({
      children: [
        buildChild({
          childLineId: "child-a",
          childExtraTotal: undefined,
          modifierExtraTotal: undefined,
          chargedModifierTotal: undefined,
        }),
        buildChild({
          childLineId: "child-b",
          productId: "pizza-b",
          selectedVariantOptionId: "variant-large",
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

  it("accepts allowed variants and unrestricted variants", () => {
    const result = validate({
      children: [
        buildChild({
          childLineId: "child-a",
          productId: "pizza-a",
          selectedVariantOptionId: "anything",
        }),
        buildChild({
          childLineId: "child-b",
          productId: "pizza-b",
          selectedVariantOptionId: "variant-large",
        }),
      ],
    })

    expect(result.ok).toBe(true)
  })

  it("accepts active scheduled deals and recurring windows", () => {
    expect(
      validate({
        deal: buildDeal({
          startsAt: "2026-06-01T00:00:00.000Z",
          endsAt: "2026-06-30T00:00:00.000Z",
          availabilityWindows: [],
        }),
      }).ok
    ).toBe(true)

    expect(
      validate({
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
      }).ok
    ).toBe(true)
  })

  it("rejects disabled, future, expired, and inactive-window deals", () => {
    expectError(
      validate({ deal: buildDeal({ isEnabled: false }) }),
      "disabled_deal"
    )
    expectError(
      validate({ deal: buildDeal({ startsAt: "2026-06-02T00:00:00.000Z" }) }),
      "scheduled_deal"
    )
    expectError(
      validate({ deal: buildDeal({ endsAt: "2026-05-31T23:59:00.000Z" }) }),
      "expired_deal"
    )
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

  it("rejects wrong special type and wrong business", () => {
    expectError(
      validate({ deal: buildDeal({ specialType: "orderable_deal" }) }),
      "wrong_special_type"
    )
    expectError(
      validate({ deal: buildDeal({ businessId: "other-business" }) }),
      "wrong_business"
    )
  })

  it("rejects below min, above max, and extra items when disabled", () => {
    expectError(
      validate({ children: [buildChild({ childLineId: "child-a" })] }),
      "below_min_quantity"
    )
    expectError(
      validate({
        deal: buildDeal({
          rule: {
            minQuantity: 2,
            maxQuantity: 2,
            unitPrice: 7.99,
            allowExtraItems: true,
          },
        }),
        children: [
          buildChild({ childLineId: "child-a" }),
          buildChild({
            childLineId: "child-b",
            productId: "pizza-b",
            selectedVariantOptionId: "variant-large",
          }),
          buildChild({ childLineId: "child-c" }),
        ],
      }),
      "above_max_quantity"
    )
    expectError(
      validate({
        deal: buildDeal({
          rule: {
            minQuantity: 2,
            maxQuantity: null,
            unitPrice: 7.99,
            allowExtraItems: false,
          },
        }),
        children: [
          buildChild({ childLineId: "child-a" }),
          buildChild({
            childLineId: "child-b",
            productId: "pizza-b",
            selectedVariantOptionId: "variant-large",
          }),
          buildChild({ childLineId: "child-c" }),
        ],
      }),
      "extra_items_not_allowed"
    )
  })

  it("rejects products outside the pool and restricted variants", () => {
    expectError(
      validate({
        children: [
          buildChild({ childLineId: "child-a", productId: "not-allowed" }),
          buildChild({
            childLineId: "child-b",
            productId: "pizza-b",
            selectedVariantOptionId: "variant-large",
          }),
        ],
      }),
      "product_not_allowed"
    )
    expectError(
      validate({
        children: [
          buildChild({ childLineId: "child-a", productId: "pizza-a" }),
          buildChild({
            childLineId: "child-b",
            productId: "pizza-b",
            selectedVariantOptionId: "variant-small",
          }),
        ],
      }),
      "variant_not_allowed"
    )
  })

  it("does not let another product's variant restriction allow this product", () => {
    expectError(
      validate({
        deal: buildDeal({
          poolProducts: [
            {
              productId: "pizza-a",
              allowedVariantOptionIds: ["variant-small"],
            },
            {
              productId: "pizza-b",
              allowedVariantOptionIds: ["variant-large"],
            },
          ],
        }),
        children: [
          buildChild({
            childLineId: "child-a",
            productId: "pizza-a",
            selectedVariantOptionId: "variant-large",
          }),
          buildChild({
            childLineId: "child-b",
            productId: "pizza-b",
            selectedVariantOptionId: "variant-large",
          }),
        ],
      }),
      "variant_not_allowed"
    )
  })

  it("rejects invalid unit price and min/max rules", () => {
    expectError(
      validate({
        deal: buildDeal({
          rule: {
            minQuantity: 2,
            maxQuantity: null,
            unitPrice: 0,
            allowExtraItems: true,
          },
        }),
      }),
      "invalid_unit_price"
    )
    expectError(
      validate({
        deal: buildDeal({
          rule: {
            minQuantity: 3,
            maxQuantity: 2,
            unitPrice: 7.99,
            allowExtraItems: true,
          },
        }),
      }),
      "invalid_quantity_rule"
    )
    expectError(
      validate({
        deal: buildDeal({
          rule: {
            minQuantity: 0,
            maxQuantity: null,
            unitPrice: 7.99,
            allowExtraItems: true,
          },
        }),
      }),
      "invalid_quantity_rule"
    )
  })

  it("rejects negative child extras and zero child quantities", () => {
    expectError(
      validate({
        children: [
          buildChild({ childLineId: "child-a", childExtraTotal: -1 }),
          buildChild({
            childLineId: "child-b",
            productId: "pizza-b",
            selectedVariantOptionId: "variant-large",
          }),
        ],
      }),
      "negative_child_extra"
    )
    expectError(
      validate({
        children: [
          buildChild({ childLineId: "child-a", quantity: 0 }),
          buildChild({
            childLineId: "child-b",
            productId: "pizza-b",
            selectedVariantOptionId: "variant-large",
          }),
        ],
      }),
      "invalid_child_quantity"
    )
  })

  it("returns useful error messages and child references", () => {
    const result = validate({
      children: [
        buildChild({
          childLineId: "bad-child",
          productId: "not-allowed",
          productName: "Wrong Product",
        }),
      ],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "product_not_allowed",
          message: expect.stringContaining("Wrong Product"),
          childLineId: "bad-child",
          productId: "not-allowed",
        }),
      ])
    )
  })
})
