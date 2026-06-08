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
      children: [
        {
          childLineId: "child-1",
          productId: "product-1",
          productName: "Build Your Own Pizza",
          variantId: "large",
          variantName: "Large",
          quantity: 1,
          configuredLineTotal: 18,
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

function AddDealButton() {
  const { addDealItem } = useCart()

  return (
    <button type="button" onClick={() => addDealItem(dealItem)}>
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
    expect(screen.getByText("Toppings")).toBeTruthy()
    expect(screen.getByText("Pepperoni (Right) x2")).toBeTruthy()
    expect(screen.getAllByText("$32.49").length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull()
    expect(screen.getByRole("button", { name: "Customize" })).toBeTruthy()
  })
})
