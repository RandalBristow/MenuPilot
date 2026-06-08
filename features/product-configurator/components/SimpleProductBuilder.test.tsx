import "@testing-library/jest-dom/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { CartProvider } from "@/features/cart/context/CartProvider"
import type { ProductConfig } from "./ProductConfigurator"
import { SimpleProductBuilder } from "./SimpleProductBuilder"

function buildSimpleProduct(overrides: Partial<ProductConfig> = {}): ProductConfig {
  return {
    id: "iced-tea",
    name: "Iced Tea",
    description: "Fresh brewed tea.",
    builder_template: "drink",
    has_variants: true,
    is_enabled: true,
    base_price: 2.5,
    variants: [
      {
        id: "small",
        name: "Small",
        base_price: 2.5,
        is_default: true,
        is_enabled: true,
        sort_order: 1,
      },
      {
        id: "large",
        name: "Large",
        base_price: 3.5,
        is_default: false,
        is_enabled: true,
        sort_order: 2,
      },
    ],
    product_modifier_groups: [],
    product_included_modifier_groups: [],
    product_default_modifier_options: [],
    product_variant_modifier_option_availability_rules: [],
    product_variant_modifier_option_price_overrides: [],
    ...overrides,
  }
}

function renderSimpleProductBuilder({
  product = buildSimpleProduct(),
  onConfiguredItem,
  submitBehavior,
  allowedVariantOptionIds,
}: {
  product?: ProductConfig
  onConfiguredItem?: Parameters<typeof SimpleProductBuilder>[0]["onConfiguredItem"]
  submitBehavior?: Parameters<typeof SimpleProductBuilder>[0]["submitBehavior"]
  allowedVariantOptionIds?: string[] | null
} = {}) {
  return render(
    <CartProvider>
      <SimpleProductBuilder
        product={product}
        open
        onOpenChange={() => undefined}
        mode="create"
        submitBehavior={submitBehavior}
        onConfiguredItem={onConfiguredItem}
        allowedVariantOptionIds={allowedVariantOptionIds}
      />
    </CartProvider>
  )
}

describe("SimpleProductBuilder", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal("crypto", {
      randomUUID: () => "cart-simple",
    })
  })

  it("handles a variant-only product", () => {
    renderSimpleProductBuilder()

    expect(screen.getByText("Choose an option")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /small/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: /large/i })).toBeInTheDocument()
    expect(screen.queryByText("Dressing")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /large/i }))
    fireEvent.click(screen.getByRole("button", { name: /increase quantity/i }))

    expect(screen.getByRole("button", { name: /add to cart/i })).toHaveTextContent(
      "$7.00"
    )
  })

  it("filters variants when a deal component provides allowed variants", () => {
    renderSimpleProductBuilder({
      allowedVariantOptionIds: ["large"],
    })

    expect(screen.queryByRole("button", { name: /small/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /large/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("shows quantity before variant selections", () => {
    renderSimpleProductBuilder()

    const quantityHeading = screen.getByText("Quantity")
    const variantHeading = screen.getByText("Choose an option")

    expect(
      quantityHeading.compareDocumentPosition(variantHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("handles a quantity-only product", () => {
    renderSimpleProductBuilder({
      product: buildSimpleProduct({
        id: "chips",
        name: "Chips",
        description: null,
        builder_template: "standard",
        has_variants: false,
        base_price: 1.5,
        variants: [],
      }),
    })

    expect(screen.queryByText("Choose an option")).not.toBeInTheDocument()
    expect(screen.getByText("Quantity")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add to cart/i })).toHaveTextContent(
      "$1.50"
    )
  })

  it("adds checkout-compatible cart item shape for variant-only products", () => {
    renderSimpleProductBuilder()

    fireEvent.click(screen.getByRole("button", { name: /large/i }))
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }))

    const storedCart = JSON.parse(
      window.localStorage.getItem("menupilot-cart") ?? "[]"
    ) as unknown[]

    expect(storedCart).toEqual([
      {
        cartItemId: "cart-simple",
        productId: "iced-tea",
        productName: "Iced Tea",
        variantId: "large",
        variantName: "Large",
        quantity: 1,
        unitPrice: 3.5,
        totalPrice: 3.5,
        configuredLineTotal: 3.5,
        chargedModifierTotal: 0,
        modifierExtraTotal: 0,
        childExtraTotal: 0,
        modifiers: [],
      },
    ])
  })

  it("returns configured variant-only results without mutating cart", () => {
    const onConfiguredItem = vi.fn()

    renderSimpleProductBuilder({
      submitBehavior: "return",
      onConfiguredItem,
    })

    fireEvent.click(screen.getByRole("button", { name: /large/i }))
    fireEvent.click(screen.getByRole("button", { name: /add to special/i }))

    expect(onConfiguredItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "iced-tea",
        productName: "Iced Tea",
        variantId: "large",
        variantName: "Large",
        quantity: 1,
        unitPrice: 3.5,
        totalPrice: 3.5,
        configuredLineTotal: 3.5,
        chargedModifierTotal: 0,
        modifierExtraTotal: 0,
        childExtraTotal: 0,
        modifiers: [],
      })
    )
    expect(window.localStorage.getItem("menupilot-cart")).toBeNull()
  })
})
