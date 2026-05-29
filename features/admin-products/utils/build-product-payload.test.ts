import { describe, expect, it } from "vitest"
import { buildProductPayload } from "./build-product-payload"

function createProductFormData(overrides: Record<string, string | string[]> = {}) {
  const values = {
    name: "Large Pepperoni Pizza",
    description: "Classic pizza",
    basePrice: "14.99",
    builderTemplate: "pizza",
    hasVariants: "true",
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
      has_variants: true,
      is_enabled: true,
      image_media_id: null,
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

  it.each(["standard", "pizza", "wings", "sub", "salad", "drink"])(
    "accepts %s builder template",
    (builderTemplate) => {
      const payload = buildProductPayload(createProductFormData({ builderTemplate }))

      expect(payload.product.builder_template).toBe(builderTemplate)
    }
  )

  it("rejects unsupported builder template values", () => {
    expect(() =>
      buildProductPayload(createProductFormData({ builderTemplate: "combo" }))
    ).toThrow("Builder template is not supported yet.")

    expect(() =>
      buildProductPayload(createProductFormData({ builderTemplate: "unknown" }))
    ).toThrow("Builder template is not supported yet.")
  })

  it("handles products without variants", () => {
    const payload = buildProductPayload(
      createProductFormData({ hasVariants: "" })
    )

    expect(payload.product.has_variants).toBe(false)
  })

  it("handles products with variants", () => {
    const payload = buildProductPayload(
      createProductFormData({ hasVariants: "true" })
    )

    expect(payload.product.has_variants).toBe(true)
  })

  it("preserves optional image media id", () => {
    const payload = buildProductPayload(
      createProductFormData({ imageMediaId: "media-pizza" })
    )

    expect(payload.product.image_media_id).toBe("media-pizza")
  })

  it("allows products without image media", () => {
    const payload = buildProductPayload(
      createProductFormData({ imageMediaId: "" })
    )

    expect(payload.product.image_media_id).toBeNull()
  })

  it("treats blank image media selection as no image", () => {
    const payload = buildProductPayload(
      createProductFormData({ imageMediaId: "   " })
    )

    expect(payload.product.image_media_id).toBeNull()
  })
})
