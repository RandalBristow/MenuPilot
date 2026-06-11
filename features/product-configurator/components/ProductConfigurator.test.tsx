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

function buildModifierProduct(overrides: Partial<ProductConfig> = {}): ProductConfig {
  return buildProduct({
    id: "build-your-own",
    name: "Build Your Own Pizza",
    description: null,
    builder_template: "standard",
    has_variants: false,
    base_price: 17.99,
    product_modifier_groups: [
      {
        id: "pmg-toppings",
        is_enabled: true,
        sort_order: 1,
        modifier_groups: {
          id: "toppings",
          name: "Pizza Toppings",
          selection_type: "multiple",
          is_required: false,
          is_enabled: true,
          min_required: 0,
          max_allowed: null,
          supports_placement: false,
          supports_multiplier: false,
          min_multiplier: 1,
          max_multiplier: 1,
          multiplier_step: 1,
          modifier_options: [
            {
              id: "pepperoni",
              name: "Pepperoni",
              price_delta: 2,
              is_enabled: true,
              sort_order: 1,
              modifier_option_group_id: null,
              modifier_option_groups: null,
            },
          ],
        },
      },
    ],
    product_included_modifier_groups: [],
    ...overrides,
  })
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

  it("hides normal variant price for fixed deal component return mode", () => {
    render(
      <CartProvider>
        <ProductConfigurator
          product={buildProduct({
            id: "large-pizza",
            name: "Build Your Own Pizza",
            description: null,
            builder_template: "standard",
            has_variants: true,
            base_price: 12.99,
            variants: [
              {
                id: "large",
                name: '16"',
                base_price: 17.99,
                is_default: true,
                is_enabled: true,
                sort_order: 1,
              },
            ],
          })}
          open
          onOpenChange={() => undefined}
          mode="create"
          submitBehavior="return"
          onConfiguredItem={() => undefined}
          allowedVariantOptionIds={["large"]}
          dealComponentPricingContext={{
            pricingMode: "fixed_price",
            fixedPrice: 7.99,
            componentLabel: "Pizza 1",
            displayPricingContext: true,
          }}
        />
      </CartProvider>
    )

    expect(
      screen.getByRole("button", { name: /add to special\s*fixed deal price\s*\$7\.99/i })
    ).toBeInTheDocument()
    expect(screen.queryByText("$17.99")).not.toBeInTheDocument()
    expect(screen.queryByText("Normally $17.99")).not.toBeInTheDocument()
  })

  it("hides normal variant price for included deal component return mode", () => {
    render(
      <CartProvider>
        <ProductConfigurator
          product={buildProduct({
            id: "soda",
            name: "Pepsi",
            description: null,
            builder_template: "standard",
            has_variants: true,
            base_price: 2.49,
            variants: [
              {
                id: "two-liter",
                name: "2 Liter",
                base_price: 3.49,
                is_default: true,
                is_enabled: true,
                sort_order: 1,
              },
            ],
          })}
          open
          onOpenChange={() => undefined}
          mode="create"
          submitBehavior="return"
          onConfiguredItem={() => undefined}
          allowedVariantOptionIds={["two-liter"]}
          dealComponentPricingContext={{
            pricingMode: "included",
            fixedPrice: null,
            componentLabel: "Soda",
            displayPricingContext: true,
          }}
        />
      </CartProvider>
    )

    expect(
      screen.getByRole("button", { name: /add to special\s*included in deal\s*\$0\.00/i })
    ).toBeInTheDocument()
    expect(screen.queryByText("$3.49")).not.toBeInTheDocument()
    expect(screen.queryByText("Normally $3.49")).not.toBeInTheDocument()
  })

  it("keeps normal product configurator pricing outside deal return mode", () => {
    render(
      <CartProvider>
        <ProductConfigurator
          product={buildProduct({
            id: "large-pizza",
            name: "Build Your Own Pizza",
            description: null,
            builder_template: "standard",
            has_variants: true,
            base_price: 12.99,
            variants: [
              {
                id: "large",
                name: '16"',
                base_price: 17.99,
                is_default: true,
                is_enabled: true,
                sort_order: 1,
              },
            ],
          })}
          open
          onOpenChange={() => undefined}
          mode="create"
        />
      </CartProvider>
    )

    expect(
      screen.getByRole("button", { name: /add to cart\s*\$17\.99/i })
    ).toBeInTheDocument()
    expect(screen.getAllByText("$17.99").length).toBeGreaterThan(0)
    expect(screen.queryByText("Normally $17.99")).not.toBeInTheDocument()
  })

  it("adds modifier extras to fixed deal component display total", () => {
    render(
      <CartProvider>
        <ProductConfigurator
          product={buildModifierProduct()}
          open
          onOpenChange={() => undefined}
          mode="create"
          submitBehavior="return"
          onConfiguredItem={() => undefined}
          dealComponentPricingContext={{
            pricingMode: "fixed_price",
            fixedPrice: 7.99,
            componentLabel: "Pizza 1",
            displayPricingContext: true,
          }}
        />
      </CartProvider>
    )

    expect(
      screen.getByRole("button", { name: /add to special\s*fixed deal price\s*\$7\.99/i })
    ).toBeInTheDocument()
    expect(screen.getByText("+$2.00")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /pepperoni/i }))

    expect(
      screen.getByRole("button", { name: /add to special\s*fixed deal price\s*\$9\.99/i })
    ).toBeInTheDocument()
  })

  it("adds modifier extras to included deal component display total", () => {
    render(
      <CartProvider>
        <ProductConfigurator
          product={buildModifierProduct()}
          open
          onOpenChange={() => undefined}
          mode="create"
          submitBehavior="return"
          onConfiguredItem={() => undefined}
          dealComponentPricingContext={{
            pricingMode: "included",
            fixedPrice: null,
            componentLabel: "Pizza 1",
            displayPricingContext: true,
          }}
        />
      </CartProvider>
    )

    expect(
      screen.getByRole("button", { name: /add to special\s*included in deal\s*\$0\.00/i })
    ).toBeInTheDocument()
    expect(screen.getByText("+$2.00")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /pepperoni/i }))

    expect(
      screen.getByRole("button", { name: /add to special\s*included in deal\s*\$2\.00/i })
    ).toBeInTheDocument()
  })
})
