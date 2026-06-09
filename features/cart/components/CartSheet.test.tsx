import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { DealCartItem } from "@/features/cart/types/cart"
import { CartProvider, useCart } from "@/features/cart/context/CartProvider"
import { CartSheet } from "./CartSheet"

vi.mock("@/features/product-configurator/queries/get-product-config", () => ({
  getProductConfig: vi.fn(),
}))

vi.mock("@/features/specials/components/DealBuilder", () => ({
  DealBuilder: () => <div>Deal builder mock</div>,
}))

const dealItem: DealCartItem = {
  cartItemId: "deal-1",
  itemType: "deal",
  businessId: "business-1",
  businessSlug: "demo",
  locationId: "location-1",
  locationSlug: "main",
  specialId: "special-1",
  specialName: "Family Night",
  usesComponentPricing: true,
  componentBaseTotal: 29.99,
  dealBasePrice: 29.99,
  childExtraTotal: 2.5,
  totalPrice: 32.49,
  components: [
    {
      componentId: "component-1",
      componentLabel: "Choose your pizza",
      sortOrder: 1,
      requiredQuantity: 1,
      selectedQuantity: 1,
      pricingMode: "fixed_price",
      fixedPrice: 29.99,
      componentBaseTotal: 29.99,
      children: [
        {
          childLineId: "child-1",
          productId: "product-1",
          productName: "Build Your Own Pizza",
          variantId: "large",
          variantName: "Large",
          quantity: 1,
          configuredLineTotal: 18,
          componentPricingMode: "fixed_price",
          componentFixedPrice: 29.99,
          componentBasePrice: 29.99,
          childExtraTotal: 2.5,
          modifiers: [
            {
              optionId: "pepperoni",
              optionName: "Pepperoni",
              groupId: "toppings",
              groupName: "Toppings",
              placement: "right",
              multiplier: 2,
              priceDelta: 2.5,
            },
          ],
        },
      ],
    },
  ],
}

const mixDealItem: DealCartItem = {
  cartItemId: "mix-1",
  itemType: "deal",
  specialType: "mix_and_match_fixed_unit_price",
  businessId: "business-1",
  businessSlug: "demo",
  locationId: "location-1",
  locationSlug: "main",
  specialId: "special-mix",
  specialName: "Any 2 Subs",
  ruleSummary: "Any 2+ for $7.99 each",
  selectedQuantity: 2,
  unitPrice: 7.99,
  mixBaseTotal: 15.98,
  dealBasePrice: 15.98,
  childExtraTotal: 1,
  totalPrice: 16.98,
  components: [
    {
      componentId: "mix:special-mix",
      componentLabel: "Mix & Match selections",
      sortOrder: 1,
      requiredQuantity: 2,
      selectedQuantity: 2,
      children: [
        {
          childLineId: "mix-child-1",
          productId: "product-1",
          productName: "Italian Sub",
          variantId: null,
          variantName: null,
          quantity: 2,
          configuredLineTotal: 18,
          childExtraTotal: 1,
          modifiers: [],
        },
      ],
    },
  ],
}

function AddDealButton({ item = dealItem }: { item?: DealCartItem }) {
  const { addDealItem } = useCart()

  return (
    <button type="button" onClick={() => addDealItem(item)}>
      Add deal
    </button>
  )
}

describe("CartSheet deal display", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it("renders deal parent and nested component child details", () => {
    render(
      <CartProvider>
        <AddDealButton />
        <CartSheet trigger={<button type="button">Open cart</button>} />
      </CartProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Add deal" }))
    fireEvent.click(screen.getByRole("button", { name: "Open cart" }))

    expect(screen.getByText("Family Night")).toBeTruthy()
    expect(screen.getByText("Deal")).toBeTruthy()
    expect(screen.getByText("Choose your pizza")).toBeTruthy()
    expect(screen.getByText("Build Your Own Pizza")).toBeTruthy()
    expect(screen.getByText("Large")).toBeTruthy()
    expect(screen.getByText("Fixed price $29.99")).toBeTruthy()
    expect(screen.getByText("Toppings")).toBeTruthy()
    expect(screen.getByText("Pepperoni (Right) x2")).toBeTruthy()
    expect(screen.getAllByText("$32.49").length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull()
    expect(screen.getByRole("button", { name: "Customize" })).toBeTruthy()
  })

  it("shows included deal children clearly", () => {
    const includedDealItem: DealCartItem = {
      ...dealItem,
      cartItemId: "included-deal",
      specialName: "Pizza and Soda",
      dealBasePrice: 15.98,
      componentBaseTotal: 15.98,
      childExtraTotal: 0,
      totalPrice: 15.98,
      components: [
        {
          ...dealItem.components[0],
          children: [
            {
              ...dealItem.components[0].children[0],
              componentPricingMode: "included",
              componentFixedPrice: null,
              componentBasePrice: 0,
              childExtraTotal: 0,
            },
          ],
        },
      ],
    }

    render(
      <CartProvider>
        <AddDealButton item={includedDealItem} />
        <CartSheet trigger={<button type="button">Open cart</button>} />
      </CartProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Add deal" }))
    fireEvent.click(screen.getByRole("button", { name: "Open cart" }))

    expect(screen.getByText("Pizza and Soda")).toBeTruthy()
    expect(screen.getByText("Included")).toBeTruthy()
  })

  it("renders Mix & Match deal details without an edit action", () => {
    render(
      <CartProvider>
        <AddDealButton item={mixDealItem} />
        <CartSheet trigger={<button type="button">Open cart</button>} />
      </CartProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Add deal" }))
    fireEvent.click(screen.getByRole("button", { name: "Open cart" }))

    expect(screen.getByText("Any 2 Subs")).toBeTruthy()
    expect(screen.getByText("Mix & Match")).toBeTruthy()
    expect(screen.getByText("Any 2+ for $7.99 each")).toBeTruthy()
    expect(screen.getByText("Extras +$1.00")).toBeTruthy()
    expect(screen.getByText("Mix & Match selections")).toBeTruthy()
    expect(screen.getByText("Italian Sub")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Customize" })).toBeNull()
  })
})
