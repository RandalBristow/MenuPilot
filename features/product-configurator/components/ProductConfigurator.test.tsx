import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CartProvider } from "@/features/cart/context/CartProvider"
import type { ProductConfig } from "./ProductConfigurator"
import { ProductConfigurator } from "./ProductConfigurator"

function buildProduct(overrides: Partial<ProductConfig> = {}): ProductConfig {
  return {
    id: "family-combo",
    name: "Family Combo",
    description: "Future combo product.",
    builder_template: "combo",
    has_variants: false,
    is_enabled: true,
    base_price: 25,
    variants: [],
    product_modifier_groups: [],
    product_included_modifier_groups: [],
    product_default_modifier_options: [],
    product_variant_modifier_option_availability_rules: [],
    product_variant_modifier_option_price_overrides: [],
    ...overrides,
  }
}

describe("ProductConfigurator", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal("crypto", {
      randomUUID: () => "cart-product-configurator",
    })
  })

  it("shows a safe unsupported message for combo products", () => {
    render(
      <ProductConfigurator
        product={buildProduct()}
        open
        onOpenChange={() => undefined}
        mode="create"
      />
    )

    expect(screen.getByText("Family Combo")).toBeInTheDocument()
    expect(
      screen.getByText("Combos and bundles are coming soon.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /add to cart/i }))
      .not.toBeInTheDocument()
  })

  it("defaults to cart submit behavior", () => {
    render(
      <CartProvider>
        <ProductConfigurator
          product={buildProduct({
            id: "chips",
            name: "Chips",
            description: null,
            builder_template: "standard",
            has_variants: false,
            base_price: 1.5,
          })}
          open
          onOpenChange={() => undefined}
          mode="create"
        />
      </CartProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }))

    expect(
      JSON.parse(window.localStorage.getItem("menupilot-cart") ?? "[]")
    ).toEqual([
      expect.objectContaining({
        cartItemId: "cart-product-configurator",
        productId: "chips",
        productName: "Chips",
        totalPrice: 1.5,
      }),
    ])
  })
})
