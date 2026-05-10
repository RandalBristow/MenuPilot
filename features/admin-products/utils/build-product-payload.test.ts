import { describe, expect, it } from "vitest"
import { buildProductPayload } from "./build-product-payload"

function createProductFormData(overrides: Record<string, string | string[]> = {}) {
  const values = {
    name: "Large Pepperoni Pizza",
    description: "Classic pizza",
    basePrice: "14.99",
    builderTemplate: "pizza",
    menuGroupId: "menu-group-pizza",
    modifierGroupIds: ["modifier-crust", "modifier-toppings"],
    ...overrides,
  }

  const formData = new FormData()

  Object.entries(values).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item))
      return
    }

    formData.set(key, value)
  })

  return formData
}

describe("buildProductPayload", () => {
  it("builds a valid product payload", () => {
    const payload = buildProductPayload(createProductFormData())

    expect(payload.product).toEqual({
      name: "Large Pepperoni Pizza",
      slug: "large-pepperoni-pizza",
      description: "Classic pizza",
      base_price: 14.99,
      builder_template: "pizza",
      has_variants: false,
      is_enabled: true,
    })
  })

  it("trims product name", () => {
    const payload = buildProductPayload(
      createProductFormData({ name: "  Garden Salad  " })
    )

    expect(payload.product.name).toBe("Garden Salad")
    expect(payload.product.slug).toBe("garden-salad")
  })

  it("rejects empty product name", () => {
    expect(() =>
      buildProductPayload(createProductFormData({ name: "   " }))
    ).toThrow("Product name is required.")
  })

  it("rejects negative base price", () => {
    expect(() =>
      buildProductPayload(createProductFormData({ basePrice: "-1" }))
    ).toThrow("Base price must be zero or greater.")
  })

  it("allows no modifier groups", () => {
    const payload = buildProductPayload(
      createProductFormData({ modifierGroupIds: [] })
    )

    expect(payload.modifierGroupIds).toEqual([])
  })

  it("preserves selected menu group id", () => {
    const payload = buildProductPayload(
      createProductFormData({ menuGroupId: "menu-group-wings" })
    )

    expect(payload.menuGroupId).toBe("menu-group-wings")
  })

  it("preserves selected modifier group ids", () => {
    const payload = buildProductPayload(
      createProductFormData({
        modifierGroupIds: ["modifier-sauce", "modifier-size"],
      })
    )

    expect(payload.modifierGroupIds).toEqual([
      "modifier-sauce",
      "modifier-size",
    ])
  })

  it("marks products with variants as variant products", () => {
    const payload = buildProductPayload(
      createProductFormData({
        variantIds: ["variant-small", ""],
        variantNames: ["Small", "Large"],
        variantBasePrices: ["10.99", "14.99"],
        variantSortOrders: ["0", "1"],
        variantIsEnabled: ["true", "false"],
        defaultVariantIndex: "1",
      })
    )

    expect(payload.product.has_variants).toBe(true)
    expect(payload.variants).toEqual([
      {
        id: "variant-small",
        name: "Small",
        base_price: 10.99,
        is_default: false,
        is_enabled: true,
        sort_order: 0,
      },
      {
        id: null,
        name: "Large",
        base_price: 14.99,
        is_default: true,
        is_enabled: false,
        sort_order: 1,
      },
    ])
  })

  it("requires one default variant when variants are present", () => {
    expect(() =>
      buildProductPayload(
        createProductFormData({
          variantNames: ["Small"],
          variantBasePrices: ["10.99"],
          variantSortOrders: ["0"],
          variantIsEnabled: ["true"],
        })
      )
    ).toThrow("Choose one default variant.")
  })
})
