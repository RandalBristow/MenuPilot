import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CartProvider } from "@/features/cart/context/CartProvider"
import type {
  ConfiguredCartItem,
  ConfiguredProductResult,
} from "@/features/cart/types/cart"
import type { ProductConfig } from "./ProductConfigurator"
import { GenericConfigurableBuilder } from "./GenericConfigurableBuilder"

function buildModifierGroup(
  overrides: Partial<
    NonNullable<ProductConfig["product_modifier_groups"][number]["modifier_groups"]>
  > = {}
): NonNullable<ProductConfig["product_modifier_groups"][number]["modifier_groups"]> {
  return {
    id: "dressing-group",
    name: "Dressing",
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
        id: "ranch",
        name: "Ranch",
        price_delta: 0,
        is_enabled: true,
        sort_order: 1,
        modifier_option_group_id: null,
        modifier_option_groups: null,
      },
      {
        id: "italian",
        name: "Italian",
        price_delta: 0,
        is_enabled: true,
        sort_order: 2,
        modifier_option_group_id: null,
        modifier_option_groups: null,
      },
    ],
    ...overrides,
  }
}

function buildProduct(overrides: Partial<ProductConfig> = {}): ProductConfig {
  return {
    id: "garden-salad",
    name: "Garden Salad",
    description: "Fresh salad",
    builder_template: "salad",
    has_variants: true,
    is_enabled: true,
    base_price: 7.99,
    variants: [
      {
        id: "regular",
        name: "Regular",
        base_price: 7.99,
        is_default: true,
        is_enabled: true,
        sort_order: 1,
      },
      {
        id: "large",
        name: "Large",
        base_price: 10.99,
        is_default: false,
        is_enabled: true,
        sort_order: 2,
      },
    ],
    product_modifier_groups: [
      {
        id: "assignment-dressing",
        is_enabled: true,
        sort_order: 1,
        modifier_groups: buildModifierGroup(),
      },
    ],
    product_included_modifier_groups: [],
    product_default_modifier_options: [],
    product_variant_modifier_option_availability_rules: [],
    product_variant_modifier_option_price_overrides: [],
    ...overrides,
  }
}

function renderGenericConfigurableBuilder({
  product = buildProduct(),
  mode = "create",
  cartItem = null,
  submitBehavior,
  onConfiguredItem,
}: {
  product?: ProductConfig
  mode?: "create" | "edit"
  cartItem?: ConfiguredCartItem | null
  submitBehavior?: Parameters<typeof GenericConfigurableBuilder>[0]["submitBehavior"]
  onConfiguredItem?: (result: ConfiguredProductResult) => void
} = {}) {
  return render(
    <CartProvider>
      <GenericConfigurableBuilder
        product={product}
        open
        onOpenChange={() => undefined}
        mode={mode}
        cartItem={cartItem}
        submitBehavior={submitBehavior}
        onConfiguredItem={onConfiguredItem}
      />
    </CartProvider>
  )
}

describe("GenericConfigurableBuilder", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("renders assigned variants and modifier groups for a salad product", () => {
    renderGenericConfigurableBuilder()

    expect(screen.getByText("Choose an option")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /regular/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /large/i })).toBeInTheDocument()
    expect(screen.getByText("Dressing")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /ranch/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /italian/i })).toBeInTheDocument()
    expect(screen.getByText("Quantity")).toBeInTheDocument()
    expect(screen.getAllByText("Fresh salad")).toHaveLength(1)
  })

  it("shows quantity before variant and modifier selections", () => {
    renderGenericConfigurableBuilder()

    const quantityHeading = screen.getByText("Quantity")
    const variantHeading = screen.getByText("Choose an option")
    const modifierHeading = screen.getByText("Dressing")

    expect(
      quantityHeading.compareDocumentPosition(variantHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      quantityHeading.compareDocumentPosition(modifierHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("groups modifier options by modifier option group", () => {
    renderGenericConfigurableBuilder({
      product: buildProduct({
        product_modifier_groups: [
          {
            id: "assignment-toppings",
            is_enabled: true,
            sort_order: 1,
            modifier_groups: buildModifierGroup({
              id: "toppings-group",
              name: "Toppings",
              is_required: false,
              min_required: 0,
              max_allowed: 4,
              selection_type: "multiple",
              modifier_options: [
                {
                  id: "chicken",
                  name: "Chicken",
                  price_delta: 2,
                  is_enabled: true,
                  sort_order: 1,
                  modifier_option_group_id: "proteins",
                  modifier_option_groups: {
                    id: "proteins",
                    name: "Proteins",
                    description: "Add a protein",
                    is_enabled: true,
                    sort_order: 1,
                  },
                },
                {
                  id: "tomato",
                  name: "Tomato",
                  price_delta: 0,
                  is_enabled: true,
                  sort_order: 2,
                  modifier_option_group_id: "veggies",
                  modifier_option_groups: {
                    id: "veggies",
                    name: "Veggies",
                    description: null,
                    is_enabled: true,
                    sort_order: 2,
                  },
                },
              ],
            }),
          },
        ],
      }),
    })

    expect(screen.getByText("Proteins")).toBeInTheDocument()
    expect(screen.getByText("Add a protein")).toBeInTheDocument()
    expect(screen.getByText("Veggies")).toBeInTheDocument()
  })

  it("applies product default modifiers for non-pizza products in create mode", async () => {
    renderGenericConfigurableBuilder({
      product: buildProduct({
        product_default_modifier_options: [
          {
            id: "default-ranch",
            modifier_group_id: "dressing-group",
            modifier_option_id: "ranch",
            placement: "whole",
            multiplier: 1,
            quantity: 1,
            is_enabled: true,
            sort_order: 1,
          },
        ],
      }),
    })

    expect(
      await screen.findByRole("button", { name: /ranch/i, pressed: true })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument()
  })

  it("default selected modifiers consume included selections", async () => {
    renderGenericConfigurableBuilder({
      product: buildProduct({
        base_price: 8,
        has_variants: false,
        variants: [],
        product_included_modifier_groups: [
          {
            id: "included-dressing",
            modifier_group_id: "dressing-group",
            included_quantity: 1,
            is_swappable: false,
            charge_for_extra: true,
          },
        ],
        product_default_modifier_options: [
          {
            id: "default-ranch",
            modifier_group_id: "dressing-group",
            modifier_option_id: "ranch",
            placement: "whole",
            multiplier: 1,
            quantity: 1,
            is_enabled: true,
            sort_order: 1,
          },
        ],
        product_modifier_groups: [
          {
            id: "assignment-dressing",
            is_enabled: true,
            sort_order: 1,
            modifier_groups: buildModifierGroup({
              selection_type: "multiple",
              is_required: false,
              min_required: 0,
              max_allowed: 3,
              modifier_options: [
                {
                  id: "ranch",
                  name: "Ranch",
                  price_delta: 1.5,
                  is_enabled: true,
                  sort_order: 1,
                  modifier_option_group_id: null,
                  modifier_option_groups: null,
                },
                {
                  id: "italian",
                  name: "Italian",
                  price_delta: 1,
                  is_enabled: true,
                  sort_order: 2,
                  modifier_option_group_id: null,
                  modifier_option_groups: null,
                },
              ],
            }),
          },
        ],
      }),
    })

    expect(
      await screen.findByRole("button", { name: /ranch/i, pressed: true })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument()
    expect(screen.getByText("Includes 1 selection.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /italian/i }))
    expect(screen.getByRole("button", { name: /add to cart/i })).toHaveTextContent(
      "$9.00"
    )
  })

  it("blocks add to cart when a required modifier group has no selection", () => {
    renderGenericConfigurableBuilder()

    expect(screen.getByText("Please choose at least 1.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeDisabled()
  })

  it("filters modifier options by selected variant availability", () => {
    renderGenericConfigurableBuilder({
      product: buildProduct({
        product_variant_modifier_option_availability_rules: [
          {
            variant_group_option_id: "large",
            modifier_group_id: "dressing-group",
            modifier_option_id: "italian",
            is_available: false,
            is_enabled: true,
          },
        ],
      }),
    })

    expect(screen.getByRole("button", { name: /italian/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /large/i }))

    expect(screen.queryByRole("button", { name: /italian/i })).not.toBeInTheDocument()
  })

  it("updates modifier option prices by selected variant", () => {
    renderGenericConfigurableBuilder({
      product: buildProduct({
        product_modifier_groups: [
          {
            id: "assignment-protein",
            is_enabled: true,
            sort_order: 1,
            modifier_groups: buildModifierGroup({
              id: "protein-group",
              name: "Protein",
              is_required: false,
              min_required: 0,
              max_allowed: 2,
              selection_type: "multiple",
              modifier_options: [
                {
                  id: "chicken",
                  name: "Chicken",
                  price_delta: 1,
                  is_enabled: true,
                  sort_order: 1,
                  modifier_option_group_id: null,
                  modifier_option_groups: null,
                },
              ],
            }),
          },
        ],
        product_variant_modifier_option_price_overrides: [
          {
            variant_group_option_id: "large",
            modifier_group_id: "protein-group",
            modifier_option_id: "chicken",
            price_delta: 2,
            is_enabled: true,
          },
        ],
      }),
    })

    const proteinGroup = screen.getByText("Protein").closest("div")
    expect(proteinGroup).not.toBeNull()
    expect(screen.getByText("+$1.00")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /large/i }))

    expect(screen.getByText("+$2.00")).toBeInTheDocument()
    expect(within(proteinGroup as HTMLElement).getByText("Protein")).toBeInTheDocument()
  })

  it("keeps quantity-only behavior for products without variants or modifiers", () => {
    renderGenericConfigurableBuilder({
      product: buildProduct({
        builder_template: "standard",
        has_variants: false,
        variants: [],
        product_modifier_groups: [],
      }),
    })

    expect(screen.getByText("Quantity")).toBeInTheDocument()
    expect(screen.queryByText("Choose an option")).not.toBeInTheDocument()
    expect(screen.queryByText("Dressing")).not.toBeInTheDocument()
  })

  it("preserves saved cart selections in edit mode", () => {
    renderGenericConfigurableBuilder({
      mode: "edit",
      cartItem: {
        cartItemId: "cart-salad",
        productId: "garden-salad",
        productName: "Garden Salad",
        variantId: "large",
        variantName: "Large",
        quantity: 2,
        unitPrice: 10.99,
        totalPrice: 21.98,
        modifiers: [
          {
            optionId: "italian",
            optionName: "Italian",
            groupId: "dressing-group",
            groupName: "Dressing",
            placement: "whole",
            multiplier: 1,
            priceDelta: 0,
          },
        ],
      },
    })

    expect(
      screen.getByRole("button", { name: /italian/i, pressed: true })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled()
  })

  it("supports products with variants but no modifiers", () => {
    renderGenericConfigurableBuilder({
      product: buildProduct({
        product_modifier_groups: [],
      }),
    })

    expect(screen.getByText("Choose an option")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /regular/i })).toBeInTheDocument()
    expect(screen.queryByText("Dressing")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeEnabled()
  })

  it("supports products with modifiers but no variants", () => {
    renderGenericConfigurableBuilder({
      product: buildProduct({
        has_variants: false,
        variants: [],
        product_modifier_groups: [
          {
            id: "assignment-protein",
            is_enabled: true,
            sort_order: 1,
            modifier_groups: buildModifierGroup({
              id: "protein-group",
              name: "Protein",
              is_required: false,
              min_required: 0,
              max_allowed: 1,
            }),
          },
        ],
      }),
    })

    expect(screen.queryByText("Choose an option")).not.toBeInTheDocument()
    expect(screen.getByText("Protein")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeEnabled()
  })

  it("uses generic placement labels when a non-pizza group supports placement", () => {
    renderGenericConfigurableBuilder({
      product: buildProduct({
        product_modifier_groups: [
          {
            id: "assignment-dressing",
            is_enabled: true,
            sort_order: 1,
            modifier_groups: buildModifierGroup({
              supports_placement: true,
              is_required: false,
              min_required: 0,
            }),
          },
        ],
      }),
    })

    fireEvent.click(screen.getByRole("button", { name: /ranch/i }))

    expect(
      screen.getByRole("button", {
        name: /set ranch placement to whole item/i,
      })
    ).toBeInTheDocument()
    expect(screen.queryByText("Whole pizza")).not.toBeInTheDocument()
  })

  it("returns configured results without mutating cart", () => {
    const onConfiguredItem = vi.fn()

    renderGenericConfigurableBuilder({
      submitBehavior: "return",
      onConfiguredItem,
    })

    fireEvent.click(screen.getByRole("button", { name: /large/i }))
    fireEvent.click(screen.getByRole("button", { name: /ranch/i }))
    fireEvent.click(screen.getByRole("button", { name: /add to special/i }))

    expect(onConfiguredItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "garden-salad",
        productName: "Garden Salad",
        variantId: "large",
        variantName: "Large",
        quantity: 1,
        unitPrice: 10.99,
        totalPrice: 10.99,
        configuredLineTotal: 10.99,
        chargedModifierTotal: 0,
        modifierExtraTotal: 0,
        childExtraTotal: 0,
        modifiers: [
          {
            optionId: "ranch",
            optionName: "Ranch",
            groupId: "dressing-group",
            groupName: "Dressing",
            placement: "whole",
            multiplier: 1,
            priceDelta: 0,
          },
        ],
      })
    )
    expect(window.localStorage.getItem("menupilot-cart")).toBeNull()
  })
})
