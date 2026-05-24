import { describe, expect, it } from "vitest"
import {
  validateAndPriceCart,
  type CheckoutProductConfig,
  type CheckoutSubmittedCartItem,
} from "./validate-and-price-cart"

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

  it("does not block required groups with zero available options", () => {
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

    expect(result.ok).toBe(true)
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
})
