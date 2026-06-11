import { describe, expect, it } from "vitest"
import {
  validateAndPriceCart,
  type CheckoutProductConfig,
  type CheckoutSubmittedCartItem,
} from "./validate-and-price-cart"
import { DEFAULT_BUSINESS_PRICING_SETTINGS } from "@/lib/pricing/business-pricing-settings"
import { priceConfiguredProduct } from "@/lib/pricing/price-configured-product"

const enabledProduct = {
  id: "product-pizza",
  name: "Build Your Own Pizza",
  isEnabled: true,
  basePrice: 12.5,
} satisfies CheckoutProductConfig

const productWithVariants = {
  ...enabledProduct,
  variants: [
    {
      id: "size-10",
      name: '10"',
      basePrice: 8.99,
      isEnabled: true,
    },
    {
      id: "size-16",
      name: '16"',
      basePrice: 19.49,
      isEnabled: true,
    },
  ],
} satisfies CheckoutProductConfig

const disabledProduct = {
  id: "product-wings",
  name: "Wings",
  isEnabled: false,
  basePrice: 9.99,
} satisfies CheckoutProductConfig

function buildCartItem(
  overrides: Partial<CheckoutSubmittedCartItem> = {}
): CheckoutSubmittedCartItem {
  return {
    cartItemId: "cart-1",
    productId: "product-pizza",
    productName: "Client Product Name",
    variantId: null,
    variantName: null,
    quantity: 2,
    unitPrice: 1,
    totalPrice: 2,
    modifiers: [],
    ...overrides,
  }
}

function buildModifier(
  overrides: Partial<CheckoutSubmittedCartItem["modifiers"][number]> = {}
): CheckoutSubmittedCartItem["modifiers"][number] {
  return {
    optionId: "pepperoni",
    optionName: "Client Pepperoni",
    groupId: "toppings",
    groupName: "Client Toppings",
    placement: "whole",
    multiplier: 1,
    priceDelta: 99,
    ...overrides,
  }
}

const productWithModifiers = {
  ...enabledProduct,
  modifierGroups: [
    {
      id: "toppings",
      name: "Pizza Toppings",
      isAssignmentEnabled: true,
      isEnabled: true,
      isRequired: false,
      minRequired: 0,
      maxAllowed: null,
      supportsPlacement: true,
      supportsMultiplier: true,
      minMultiplier: 1,
      maxMultiplier: 3,
      multiplierStep: 1,
      options: [
        {
          id: "pepperoni",
          name: "Pepperoni",
          priceDelta: 1.5,
          isEnabled: true,
          optionGroup: {
            id: "meats",
            name: "Meats",
            isEnabled: true,
          },
        },
        {
          id: "mushrooms",
          name: "Mushrooms",
          priceDelta: 1,
          isEnabled: true,
          optionGroup: null,
        },
      ],
    },
  ],
} satisfies CheckoutProductConfig

const productWithCrustStyle = {
  ...enabledProduct,
  modifierGroups: [
    {
      id: "crust-style",
      name: "Crust Style",
      isAssignmentEnabled: true,
      isEnabled: true,
      isRequired: false,
      minRequired: 0,
      maxAllowed: 1,
      supportsPlacement: false,
      supportsMultiplier: false,
      options: [
        {
          id: "thin-crust",
          name: "Thin",
          priceDelta: 0,
          isEnabled: true,
          optionGroup: null,
        },
      ],
    },
  ],
} satisfies CheckoutProductConfig

describe("validateAndPriceCart", () => {
  it("rejects an empty cart", () => {
    const result = validateAndPriceCart({
      items: [],
      products: [enabledProduct],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      {
        code: "empty_cart",
        message: "Cart is empty.",
      },
    ])
  })

  it("rejects a cart item when product config is missing", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ productId: "missing-product" })],
      products: [enabledProduct],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "missing_product",
        cartItemId: "cart-1",
        productId: "missing-product",
      },
    ])
  })

  it("rejects a disabled product", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          productId: disabledProduct.id,
          productName: disabledProduct.name,
        }),
      ],
      products: [disabledProduct],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "disabled_product",
        cartItemId: "cart-1",
        productId: "product-wings",
      },
    ])
  })

  it("rejects a temporarily sold-out product with a useful message", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem()],
      products: [
        {
          ...enabledProduct,
          isEnabled: false,
          isSoldOut: true,
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      {
        code: "sold_out_product",
        message: "Build Your Own Pizza is currently sold out.",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("accepts an enabled product with a valid quantity", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem()],
      products: [enabledProduct],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items).toHaveLength(1)
    expect(result.cart.items[0]).toMatchObject({
      cartItemId: "cart-1",
      productId: "product-pizza",
      quantity: 2,
      unitPrice: 12.5,
      lineSubtotal: 25,
    })
  })

  it("uses the server product name instead of the client cart product name", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ productName: "Tampered Name" })],
      products: [enabledProduct],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].productName).toBe("Build Your Own Pizza")
  })

  it("recalculates subtotal instead of trusting client totals", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          quantity: 3,
          unitPrice: 0.01,
          totalPrice: 0.03,
        }),
      ],
      products: [enabledProduct],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].unitPrice).toBe(12.5)
    expect(result.cart.items[0].lineSubtotal).toBe(37.5)
    expect(result.cart.subtotal).toBe(37.5)
  })

  it("accepts a reusable variant and prices from server config", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          variantName: "Client Variant Name",
        }),
      ],
      products: [productWithVariants],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0]).toMatchObject({
      variantId: "size-16",
      variantName: '16"',
      unitPrice: 19.49,
      lineSubtotal: 38.98,
    })
  })

  it("uses server effective variant price when an override is reflected there", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          unitPrice: 99,
          totalPrice: 198,
        }),
      ],
      products: [
        {
          ...productWithVariants,
          variants: [
            {
              id: "size-16",
              name: '16"',
              basePrice: 17.99,
              isEnabled: true,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].unitPrice).toBe(17.99)
    expect(result.cart.items[0].lineSubtotal).toBe(35.98)
  })

  it("rejects a missing variant when product has variants", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ variantId: null })],
      products: [productWithVariants],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "missing_variant",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects an invalid variant", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ variantId: "size-20" })],
      products: [productWithVariants],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "invalid_variant",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects a disabled effective variant", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ variantId: "size-16" })],
      products: [
        {
          ...productWithVariants,
          variants: [
            {
              id: "size-16",
              name: '16"',
              basePrice: 19.49,
              isEnabled: false,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "invalid_variant",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("accepts a product with no variants when cart variant is null", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ variantId: null })],
      products: [enabledProduct],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0]).toMatchObject({
      variantId: null,
      variantName: null,
      unitPrice: 12.5,
      lineSubtotal: 25,
    })
  })

  it("rejects a non-null variant when product has no variants", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ variantId: "size-16" })],
      products: [enabledProduct],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "unexpected_variant",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("ignores client-submitted price for variants", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-10",
          unitPrice: 100,
          totalPrice: 200,
        }),
      ],
      products: [productWithVariants],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].unitPrice).toBe(8.99)
    expect(result.cart.items[0].lineSubtotal).toBe(17.98)
    expect(result.cart.subtotal).toBe(17.98)
  })

  it("accepts an attached enabled modifier and uses server snapshots", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ modifiers: [buildModifier()] })],
      products: [productWithModifiers],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers).toEqual([
      {
        optionId: "pepperoni",
        optionName: "Pepperoni",
        groupId: "toppings",
        groupName: "Pizza Toppings",
        placement: "whole",
        multiplier: 1,
        priceDelta: 1.5,
      },
    ])
    expect(result.cart.items[0].unitPrice).toBe(14)
    expect(result.cart.items[0].lineSubtotal).toBe(28)
  })

  it("accepts stale-cart Thin crust while it is still enabled", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [
            buildModifier({
              groupId: "crust-style",
              groupName: "Client Crust Style",
              optionId: "thin-crust",
              optionName: "Client Thin",
              priceDelta: 99,
            }),
          ],
        }),
      ],
      products: [productWithCrustStyle],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers).toEqual([
      {
        optionId: "thin-crust",
        optionName: "Thin",
        groupId: "crust-style",
        groupName: "Crust Style",
        placement: "whole",
        multiplier: 1,
        priceDelta: 0,
      },
    ])
  })

  it("accepts a valid product default modifier selection", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [
            buildModifier({
              groupId: "crust-style",
              groupName: "Client Crust Style",
              optionId: "thin-crust",
              optionName: "Client Thin",
              priceDelta: 99,
            }),
          ],
        }),
      ],
      products: [productWithCrustStyle],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers[0]).toMatchObject({
      optionId: "thin-crust",
      optionName: "Thin",
      groupId: "crust-style",
      groupName: "Crust Style",
      priceDelta: 0,
    })
  })

  it("rejects stale-cart Thin crust when disabled by product override", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [
            buildModifier({
              groupId: "crust-style",
              optionId: "thin-crust",
            }),
          ],
        }),
      ],
      products: [
        {
          ...productWithCrustStyle,
          modifierOptionOverrides: [
            {
              modifierOptionId: "thin-crust",
              isEnabled: false,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      {
        code: "disabled_modifier_option",
        message:
          "Thin is no longer available for this item. Please update your cart.",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects a product default modifier selection that later becomes unavailable", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [
            buildModifier({
              groupId: "crust-style",
              optionId: "thin-crust",
            }),
          ],
        }),
      ],
      products: [
        {
          ...productWithCrustStyle,
          modifierGroups: [
            {
              ...productWithCrustStyle.modifierGroups[0],
              options: [
                {
                  ...productWithCrustStyle.modifierGroups[0].options[0],
                  isEnabled: false,
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "disabled_modifier_option",
        message:
          "Thin is no longer available for this item. Please update your cart.",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects a modifier group that is not attached", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [buildModifier({ groupId: "not-attached" })],
        }),
      ],
      products: [productWithModifiers],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "invalid_modifier_group",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects a disabled modifier group assignment", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ modifiers: [buildModifier()] })],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              isAssignmentEnabled: false,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "disabled_modifier_group",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects a disabled modifier group", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ modifiers: [buildModifier()] })],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              isEnabled: false,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "disabled_modifier_group",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects a disabled modifier option", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ modifiers: [buildModifier()] })],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              options: [
                {
                  ...productWithModifiers.modifierGroups[0].options[0],
                  isEnabled: false,
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "disabled_modifier_option",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects a temporarily sold-out modifier option with a useful message", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ modifiers: [buildModifier()] })],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              options: [
                {
                  ...productWithModifiers.modifierGroups[0].options[0],
                  isEnabled: false,
                  isSoldOut: true,
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      {
        code: "sold_out_modifier_option",
        message: "Pepperoni is currently sold out.",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects stale-cart Thin crust when globally disabled", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [
            buildModifier({
              groupId: "crust-style",
              optionId: "thin-crust",
            }),
          ],
        }),
      ],
      products: [
        {
          ...productWithCrustStyle,
          modifierGroups: [
            {
              ...productWithCrustStyle.modifierGroups[0],
              options: [
                {
                  ...productWithCrustStyle.modifierGroups[0].options[0],
                  isEnabled: false,
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "disabled_modifier_option",
        message:
          "Thin is no longer available for this item. Please update your cart.",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects a modifier option in a disabled option group", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ modifiers: [buildModifier()] })],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              options: [
                {
                  ...productWithModifiers.modifierGroups[0].options[0],
                  optionGroup: {
                    id: "meats",
                    name: "Meats",
                    isEnabled: false,
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "disabled_modifier_option",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("uses product modifier option override price", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ modifiers: [buildModifier()] })],
      products: [
        {
          ...productWithModifiers,
          modifierOptionOverrides: [
            {
              modifierOptionId: "pepperoni",
              priceDeltaOverride: 2.25,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers[0].priceDelta).toBe(2.25)
    expect(result.cart.items[0].unitPrice).toBe(14.75)
  })

  it("uses variant-specific modifier price before product-specific override", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          modifiers: [buildModifier({ priceDelta: 100 })],
        }),
      ],
      products: [
        {
          ...productWithVariants,
          modifierGroups: productWithModifiers.modifierGroups,
          modifierOptionOverrides: [
            {
              modifierOptionId: "pepperoni",
              priceDeltaOverride: 2,
            },
          ],
          variantModifierOptionPriceOverrides: [
            {
              variantGroupOptionId: "size-16",
              modifierGroupId: "toppings",
              modifierOptionId: "pepperoni",
              priceDelta: 2.5,
              isEnabled: true,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers[0].priceDelta).toBe(2.5)
    expect(result.cart.items[0].unitPrice).toBe(21.99)
  })

  it("falls back to product-specific modifier price when variant override is missing", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          modifiers: [buildModifier()],
        }),
      ],
      products: [
        {
          ...productWithVariants,
          modifierGroups: productWithModifiers.modifierGroups,
          modifierOptionOverrides: [
            {
              modifierOptionId: "pepperoni",
              priceDeltaOverride: 2.25,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers[0].priceDelta).toBe(2.25)
    expect(result.cart.items[0].unitPrice).toBe(21.74)
  })

  it("ignores disabled variant-specific modifier price overrides", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          modifiers: [buildModifier()],
        }),
      ],
      products: [
        {
          ...productWithVariants,
          modifierGroups: productWithModifiers.modifierGroups,
          variantModifierOptionPriceOverrides: [
            {
              variantGroupOptionId: "size-16",
              modifierGroupId: "toppings",
              modifierOptionId: "pepperoni",
              priceDelta: 9,
              isEnabled: false,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers[0].priceDelta).toBe(1.5)
    expect(result.cart.items[0].unitPrice).toBe(20.99)
  })

  it("does not apply variant modifier price override across modifier groups", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          modifiers: [buildModifier({ groupId: "premium-toppings" })],
        }),
      ],
      products: [
        {
          ...productWithVariants,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              id: "premium-toppings",
              options: [
                {
                  ...productWithModifiers.modifierGroups[0].options[0],
                  priceDelta: 3,
                },
              ],
            },
          ],
          variantModifierOptionPriceOverrides: [
            {
              variantGroupOptionId: "size-16",
              modifierGroupId: "toppings",
              modifierOptionId: "pepperoni",
              priceDelta: 1,
              isEnabled: true,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers[0].priceDelta).toBe(3)
    expect(result.cart.items[0].unitPrice).toBe(22.49)
  })

  it("rejects product modifier option disabled override", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem({ modifiers: [buildModifier()] })],
      products: [
        {
          ...productWithModifiers,
          modifierOptionOverrides: [
            {
              modifierOptionId: "pepperoni",
              isEnabled: false,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "disabled_modifier_option",
        message:
          "Pepperoni is no longer available for this item. Please update your cart.",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects a modifier option denied by variant availability", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          modifiers: [buildModifier()],
        }),
      ],
      products: [
        {
          ...productWithVariants,
          modifierGroups: productWithModifiers.modifierGroups,
          variantModifierOptionAvailabilityRules: [
            {
              variantGroupOptionId: "size-16",
              modifierGroupId: "toppings",
              modifierOptionId: "pepperoni",
              isAvailable: false,
              isEnabled: true,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "unavailable_modifier_option",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("allows a modifier option when no variant availability rule exists", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          modifiers: [buildModifier()],
        }),
      ],
      products: [
        {
          ...productWithVariants,
          modifierGroups: productWithModifiers.modifierGroups,
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers[0].optionId).toBe("pepperoni")
  })

  it("ignores disabled variant availability rules", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          modifiers: [buildModifier()],
        }),
      ],
      products: [
        {
          ...productWithVariants,
          modifierGroups: productWithModifiers.modifierGroups,
          variantModifierOptionAvailabilityRules: [
            {
              variantGroupOptionId: "size-16",
              modifierGroupId: "toppings",
              modifierOptionId: "pepperoni",
              isAvailable: false,
              isEnabled: false,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
  })

  it("requires a selection when a required group has available options", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem()],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              isRequired: true,
              minRequired: 1,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "missing_required_modifier",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("blocks required groups with zero available options", () => {
    const result = validateAndPriceCart({
      items: [buildCartItem()],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              isRequired: true,
              minRequired: 1,
              options: productWithModifiers.modifierGroups[0].options.map(
                (option) => ({
                  ...option,
                  isEnabled: false,
                })
              ),
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      {
        code: "missing_required_modifier",
        message: "Pizza Toppings has no available options right now.",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("enforces max allowed modifier selections", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [
            buildModifier({ optionId: "pepperoni" }),
            buildModifier({ optionId: "mushrooms" }),
          ],
        }),
      ],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              maxAllowed: 1,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "too_many_modifiers",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects invalid placement", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [buildModifier({ placement: "left" })],
        }),
      ],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              supportsPlacement: false,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "invalid_modifier_placement",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("rejects invalid multiplier", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [buildModifier({ multiplier: 4 })],
        }),
      ],
      products: [productWithModifiers],
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toMatchObject([
      {
        code: "invalid_modifier_multiplier",
        cartItemId: "cart-1",
        productId: "product-pizza",
      },
    ])
  })

  it("ignores client modifier price", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [buildModifier({ priceDelta: 100 })],
        }),
      ],
      products: [productWithModifiers],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers[0].priceDelta).toBe(1.5)
    expect(result.cart.items[0].unitPrice).toBe(14)
  })

  it("uses server half pizza topping pricing and ignores stale client prices", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          quantity: 1,
          modifiers: [
            buildModifier({
              placement: "left",
              multiplier: 1,
              priceDelta: 100,
            }),
          ],
        }),
      ],
      products: [
        {
          ...productWithModifiers,
          builderTemplate: "pizza",
          pricingSettings: {
            ...DEFAULT_BUSINESS_PRICING_SETTINGS,
            pizzaHalfToppingPricingEnabled: true,
            pizzaHalfToppingIncludedWeightEnabled: true,
            pizzaHalfToppingRoundingMode: "floor_to_cent",
          },
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers[0]).toMatchObject({
      optionId: "pepperoni",
      placement: "left",
      multiplier: 1,
      priceDelta: 0.75,
    })
    expect(result.cart.items[0].unitPrice).toBe(13.25)
  })

  it("counts left and right pizza toppings as half included selections", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          quantity: 1,
          modifiers: [
            buildModifier({ optionId: "pepperoni" }),
            buildModifier({
              optionId: "mushrooms",
              optionName: "Client Mushrooms",
              placement: "left",
            }),
          ],
        }),
      ],
      products: [
        {
          ...productWithModifiers,
          builderTemplate: "pizza",
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              includedQuantity: 1.5,
              chargeForExtra: true,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers).toMatchObject([
      { optionId: "pepperoni", priceDelta: 0 },
      { optionId: "mushrooms", placement: "left", priceDelta: 0 },
    ])
    expect(result.cart.items[0].unitPrice).toBe(12.5)
  })

  it("applies included modifier quantity server-side and ignores stale client prices", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          unitPrice: 1,
          totalPrice: 2,
          modifiers: [
            buildModifier({ optionId: "pepperoni", priceDelta: 99 }),
            buildModifier({
              optionId: "mushrooms",
              optionName: "Client Mushrooms",
              priceDelta: 99,
            }),
          ],
        }),
      ],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              includedQuantity: 2,
              chargeForExtra: true,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers).toMatchObject([
      { optionId: "pepperoni", priceDelta: 0 },
      { optionId: "mushrooms", priceDelta: 0 },
    ])
    expect(result.cart.items[0].unitPrice).toBe(12.5)
  })

  it("charges the third included-group modifier using server pricing", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          modifiers: [
            buildModifier({ optionId: "pepperoni" }),
            buildModifier({
              optionId: "mushrooms",
              optionName: "Client Mushrooms",
            }),
            buildModifier({
              optionId: "onions",
              optionName: "Client Onions",
              priceDelta: 99,
            }),
          ],
        }),
      ],
      products: [
        {
          ...productWithModifiers,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              includedQuantity: 2,
              chargeForExtra: true,
              options: [
                ...productWithModifiers.modifierGroups[0].options,
                {
                  id: "onions",
                  name: "Onions",
                  priceDelta: 1.25,
                  isEnabled: true,
                  optionGroup: null,
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers).toMatchObject([
      { optionId: "pepperoni", priceDelta: 0 },
      { optionId: "mushrooms", priceDelta: 0 },
      { optionId: "onions", priceDelta: 1.25 },
    ])
    expect(result.cart.items[0].unitPrice).toBe(13.75)
  })

  it("counts product defaults as included selections server-side", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          quantity: 1,
          modifiers: [
            buildModifier({ optionId: "pepperoni" }),
            buildModifier({
              optionId: "mushrooms",
              optionName: "Client Mushrooms",
            }),
            buildModifier({
              optionId: "onions",
              optionName: "Client Onions",
              priceDelta: 99,
            }),
            buildModifier({
              optionId: "bacon",
              optionName: "Client Bacon",
              priceDelta: 99,
            }),
          ],
        }),
      ],
      products: [
        {
          ...productWithModifiers,
          productDefaultModifierOptions: [
            {
              modifier_option_id: "pepperoni",
              multiplier: 1,
              quantity: 1,
              is_enabled: true,
            },
          ],
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              includedQuantity: 2,
              chargeForExtra: true,
              options: [
                ...productWithModifiers.modifierGroups[0].options,
                {
                  id: "onions",
                  name: "Onions",
                  priceDelta: 1.25,
                  isEnabled: true,
                  optionGroup: null,
                },
                {
                  id: "bacon",
                  name: "Bacon",
                  priceDelta: 2,
                  isEnabled: true,
                  optionGroup: null,
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers).toMatchObject([
      { optionId: "pepperoni", priceDelta: 0 },
      { optionId: "mushrooms", priceDelta: 0 },
      { optionId: "onions", priceDelta: 1.25 },
      { optionId: "bacon", priceDelta: 2 },
    ])
    expect(result.cart.items[0].unitPrice).toBe(15.75)
  })

  it("uses variant-specific modifier price for charged extras after included selections", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          variantId: "size-16",
          modifiers: [
            buildModifier({ optionId: "pepperoni" }),
            buildModifier({
              optionId: "mushrooms",
              optionName: "Client Mushrooms",
            }),
          ],
        }),
      ],
      products: [
        {
          ...productWithVariants,
          modifierGroups: [
            {
              ...productWithModifiers.modifierGroups[0],
              includedQuantity: 1,
              chargeForExtra: true,
            },
          ],
          variantModifierOptionPriceOverrides: [
            {
              variantGroupOptionId: "size-16",
              modifierGroupId: "toppings",
              modifierOptionId: "mushrooms",
              priceDelta: 2.75,
              isEnabled: true,
            },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].modifiers).toMatchObject([
      { optionId: "pepperoni", priceDelta: 0 },
      { optionId: "mushrooms", priceDelta: 2.75 },
    ])
    expect(result.cart.items[0].unitPrice).toBe(22.24)
  })

  it("uses the same pricing result as the shared configured product resolver", () => {
    const item = buildCartItem({
      quantity: 3,
      modifiers: [
        buildModifier({ optionId: "pepperoni" }),
        buildModifier({
          optionId: "mushrooms",
          optionName: "Client Mushrooms",
        }),
        buildModifier({
          optionId: "bacon",
          optionName: "Client Bacon",
        }),
      ],
    })
    const product = {
      ...productWithModifiers,
      modifierGroups: [
        {
          ...productWithModifiers.modifierGroups[0],
          includedQuantity: 2,
          chargeForExtra: true,
          options: [
            ...productWithModifiers.modifierGroups[0].options,
            {
              id: "bacon",
              name: "Bacon",
              priceDelta: 2,
              isEnabled: true,
              optionGroup: null,
            },
          ],
        },
      ],
    } satisfies CheckoutProductConfig
    const expectedPricing = priceConfiguredProduct({
      productBasePrice: product.basePrice,
      selectedModifiers: {
        pepperoni: { optionId: "pepperoni", multiplier: 1, placement: "whole" },
        mushrooms: { optionId: "mushrooms", multiplier: 1, placement: "whole" },
        bacon: { optionId: "bacon", multiplier: 1, placement: "whole" },
      },
      modifierGroups: [
        {
          id: "toppings",
          includedQuantity: 2,
          chargeForExtra: true,
          options: [
            { id: "pepperoni", priceDelta: 1.5 },
            { id: "mushrooms", priceDelta: 1 },
            { id: "bacon", priceDelta: 2 },
          ],
        },
      ],
      quantity: item.quantity,
    })

    const result = validateAndPriceCart({
      items: [item],
      products: [product],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0].unitPrice).toBe(expectedPricing.unitPrice)
    expect(result.cart.items[0].lineSubtotal).toBe(expectedPricing.lineTotal)
    expect(result.cart.items[0].modifiers).toMatchObject([
      { optionId: "pepperoni", priceDelta: 0 },
      { optionId: "mushrooms", priceDelta: 0 },
      { optionId: "bacon", priceDelta: 2 },
    ])
  })

  it("validates and reprices a simple variant-only product", () => {
    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          productId: "product-pizza",
          variantId: "size-16",
          variantName: "Client Large",
          quantity: 2,
          unitPrice: 0.01,
          totalPrice: 0.02,
          modifiers: [],
        }),
      ],
      products: [productWithVariants],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0]).toMatchObject({
      productId: "product-pizza",
      productName: "Build Your Own Pizza",
      variantId: "size-16",
      variantName: '16"',
      quantity: 2,
      unitPrice: 19.49,
      lineSubtotal: 38.98,
      modifiers: [],
    })
  })

  it("validates and reprices a simple quantity-only product", () => {
    const simpleProduct = {
      id: "extra-sauce",
      name: "Extra Sauce",
      isEnabled: true,
      basePrice: 0.75,
    } satisfies CheckoutProductConfig

    const result = validateAndPriceCart({
      items: [
        buildCartItem({
          productId: "extra-sauce",
          productName: "Client Sauce",
          variantId: null,
          variantName: null,
          quantity: 3,
          unitPrice: 0.01,
          totalPrice: 0.03,
          modifiers: [],
        }),
      ],
      products: [simpleProduct],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cart.items[0]).toMatchObject({
      productId: "extra-sauce",
      productName: "Extra Sauce",
      variantId: null,
      variantName: null,
      quantity: 3,
      unitPrice: 0.75,
      lineSubtotal: 2.25,
      modifiers: [],
    })
  })
})
