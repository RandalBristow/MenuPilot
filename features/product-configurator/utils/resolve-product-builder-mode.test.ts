import { describe, expect, it } from "vitest"
import { resolveProductBuilderMode } from "./resolve-product-builder-mode"

describe("resolveProductBuilderMode", () => {
  it("routes pizza template to PizzaBuilder mode", () => {
    expect(
      resolveProductBuilderMode({
        builder_template: "pizza",
        has_variants: true,
        variants: [],
        product_modifier_groups: [],
      })
    ).toBe("pizza")
  })

  it("routes non-pizza products with modifiers to GenericConfigurableBuilder mode", () => {
    expect(
      resolveProductBuilderMode({
        builder_template: "salad",
        has_variants: true,
        variants: [{ is_enabled: true }],
        product_modifier_groups: [
          {
            is_enabled: true,
            modifier_groups: {
              is_enabled: true,
            },
          },
        ],
      })
    ).toBe("generic-configurable")
  })

  it("routes products with variants and no modifiers to SimpleProductBuilder variant mode", () => {
    expect(
      resolveProductBuilderMode({
        builder_template: "drink",
        has_variants: true,
        variants: [{ is_enabled: true }],
        product_modifier_groups: [],
      })
    ).toBe("simple-variant")
  })

  it("routes products with no variants and no modifiers to SimpleProductBuilder quantity-only mode", () => {
    expect(
      resolveProductBuilderMode({
        builder_template: "standard",
        has_variants: false,
        variants: [],
        product_modifier_groups: [],
      })
    ).toBe("simple-quantity")
  })

  it("routes combo template to unsupported future mode", () => {
    expect(
      resolveProductBuilderMode({
        builder_template: "combo",
        has_variants: true,
        variants: [{ is_enabled: true }],
        product_modifier_groups: [],
      })
    ).toBe("unsupported")
  })
})
