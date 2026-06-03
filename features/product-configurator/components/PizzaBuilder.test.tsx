import "@testing-library/jest-dom/vitest"
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CartProvider } from "@/features/cart/context/CartProvider"
import { PizzaBuilder, type ProductConfig } from "./PizzaBuilder"

function buildPizzaProduct(): ProductConfig {
  return {
    id: "build-your-own-pizza",
    name: "Build Your Own Pizza",
    description: "Choose your crust, sauce, and toppings.",
    builder_template: "pizza",
    has_variants: true,
    is_enabled: true,
    base_price: 10,
    variants: [
      {
        id: "medium",
        name: "Medium",
        base_price: 10,
        is_default: true,
        is_enabled: true,
        sort_order: 1,
      },
    ],
    product_modifier_groups: [
      {
        id: "assignment-crust",
        is_enabled: true,
        sort_order: 1,
        modifier_groups: {
          id: "crust-type",
          name: "Crust Type",
          selection_type: "single",
          is_required: true,
          is_enabled: true,
          min_required: 1,
          max_allowed: 1,
          supports_placement: false,
          supports_multiplier: false,
          min_multiplier: 1,
          max_multiplier: 1,
          multiplier_step: 1,
          modifier_options: [
            {
              id: "regular-crust",
              name: "Regular",
              price_delta: 0,
              is_enabled: true,
              sort_order: 1,
              modifier_option_group_id: null,
              modifier_option_groups: null,
            },
            {
              id: "thin-crust",
              name: "Thin",
              price_delta: 0,
              is_enabled: true,
              sort_order: 2,
              modifier_option_group_id: null,
              modifier_option_groups: null,
            },
          ],
        },
      },
    ],
    product_included_modifier_groups: [],
    product_default_modifier_options: [
      {
        id: "default-regular-crust",
        modifier_group_id: "crust-type",
        modifier_option_id: "regular-crust",
        placement: "whole",
        multiplier: 1,
        quantity: 1,
        is_enabled: true,
        sort_order: 1,
      },
    ],
    product_variant_modifier_option_availability_rules: [],
    product_variant_modifier_option_price_overrides: [],
  }
}

function renderPizzaBuilder(product = buildPizzaProduct()) {
  return render(
    <CartProvider>
      <PizzaBuilder
        product={product}
        open
        onOpenChange={() => undefined}
      />
    </CartProvider>
  )
}

describe("PizzaBuilder", () => {
  it("shows selected modifier options with a checkmark and without Selected label", async () => {
    renderPizzaBuilder()

    const selectedRegular = await screen.findByRole("button", {
      name: /regular/i,
      pressed: true,
    })

    expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument()
    expect(selectedRegular.querySelector("svg")).toBeInTheDocument()
    expect(screen.getAllByText("+$0.00")).toHaveLength(2)
    expect(
      within(selectedRegular.closest("[aria-selected='true']") as HTMLElement)
        .getByText("Regular")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add to cart/i }))
      .toHaveTextContent("$10.00")
  })
})

