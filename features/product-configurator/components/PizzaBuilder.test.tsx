import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
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

function buildDeluxePizzaProduct(): ProductConfig {
  const meatGroup = {
    id: "meats",
    name: "Meats",
    description: null,
    is_enabled: true,
    sort_order: 1,
  }
  const veggieGroup = {
    id: "veggies",
    name: "Veggies",
    description: null,
    is_enabled: true,
    sort_order: 2,
  }

  return {
    ...buildPizzaProduct(),
    id: "deluxe-pizza",
    name: "Deluxe Pizza",
    product_modifier_groups: [
      {
        id: "assignment-toppings",
        is_enabled: true,
        sort_order: 1,
        modifier_groups: {
          id: "pizza-toppings",
          name: "Pizza Toppings",
          selection_type: "multiple",
          is_required: false,
          is_enabled: true,
          min_required: 0,
          max_allowed: null,
          supports_placement: true,
          supports_multiplier: true,
          min_multiplier: 1,
          max_multiplier: 2,
          multiplier_step: 1,
          modifier_options: [
            {
              id: "pepperoni",
              name: "Pepperoni",
              price_delta: 2,
              is_enabled: true,
              sort_order: 1,
              modifier_option_group_id: meatGroup.id,
              modifier_option_groups: meatGroup,
            },
            {
              id: "sausage",
              name: "Sausage",
              price_delta: 2,
              is_enabled: true,
              sort_order: 2,
              modifier_option_group_id: meatGroup.id,
              modifier_option_groups: meatGroup,
            },
            {
              id: "mushrooms",
              name: "Mushrooms",
              price_delta: 1,
              is_enabled: true,
              sort_order: 3,
              modifier_option_group_id: veggieGroup.id,
              modifier_option_groups: veggieGroup,
            },
            {
              id: "onions",
              name: "Onions",
              price_delta: 1,
              is_enabled: true,
              sort_order: 4,
              modifier_option_group_id: veggieGroup.id,
              modifier_option_groups: veggieGroup,
            },
            {
              id: "green-peppers",
              name: "Green Peppers",
              price_delta: 1,
              is_enabled: true,
              sort_order: 5,
              modifier_option_group_id: veggieGroup.id,
              modifier_option_groups: veggieGroup,
            },
            {
              id: "bacon",
              name: "Bacon",
              price_delta: 2,
              is_enabled: true,
              sort_order: 6,
              modifier_option_group_id: meatGroup.id,
              modifier_option_groups: meatGroup,
            },
            {
              id: "banana-peppers",
              name: "Banana Peppers",
              price_delta: 1,
              is_enabled: true,
              sort_order: 7,
              modifier_option_group_id: veggieGroup.id,
              modifier_option_groups: veggieGroup,
            },
          ],
        },
      },
    ],
    product_included_modifier_groups: [
      {
        id: "included-toppings",
        modifier_group_id: "pizza-toppings",
        included_quantity: 5,
        is_swappable: false,
        charge_for_extra: true,
      },
    ],
    product_default_modifier_options: [
      "pepperoni",
      "sausage",
      "mushrooms",
      "onions",
      "green-peppers",
    ].map((optionId, index) => ({
      id: `default-${optionId}`,
      modifier_group_id: "pizza-toppings",
      modifier_option_id: optionId,
      placement: "whole" as const,
      multiplier: 1,
      quantity: 1,
      is_enabled: true,
      sort_order: index + 1,
    })),
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

  it("shows quantity before pizza selections", () => {
    renderPizzaBuilder()

    const quantityHeading = screen.getByText("Quantity")
    const sizeHeading = screen.getByText("Choose Your Size")

    expect(
      quantityHeading.compareDocumentPosition(sizeHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("multiplies the pizza total by quantity", () => {
    renderPizzaBuilder()

    fireEvent.click(screen.getByRole("button", { name: /increase quantity/i }))

    expect(screen.getByRole("button", { name: /add to cart/i }))
      .toHaveTextContent("$20.00")
  })

  it("charges the sixth topping after one default topping is swapped out", async () => {
    renderPizzaBuilder(buildDeluxePizzaProduct())

    expect(await screen.findByRole("button", { name: /add to cart/i }))
      .toHaveTextContent("$10.00")

    fireEvent.click(screen.getByRole("button", {
      name: /pepperoni/i,
      pressed: true,
    }))
    fireEvent.click(screen.getByRole("button", {
      name: /bacon/i,
      pressed: false,
    }))

    expect(screen.getByRole("button", { name: /add to cart/i }))
      .toHaveTextContent("$10.00")

    fireEvent.click(screen.getByRole("button", {
      name: /banana peppers/i,
      pressed: false,
    }))

    expect(screen.getByRole("button", { name: /add to cart/i }))
      .toHaveTextContent("$11.00")
  })
})
