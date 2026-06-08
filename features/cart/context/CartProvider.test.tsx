import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { DealCartItem } from "@/features/cart/types/cart"
import { CartProvider, useCart } from "./CartProvider"

const dealItem: DealCartItem = {
  cartItemId: "deal-1",
  itemType: "deal",
  businessId: "business-1",
  businessSlug: "demo",
  locationId: "location-1",
  locationSlug: "main",
  specialId: "special-1",
  specialName: "Family Deal",
  dealBasePrice: 24.99,
  childExtraTotal: 0,
  totalPrice: 24.99,
  components: [
    {
      componentId: "component-1",
      componentLabel: "Choose a Pizza",
      sortOrder: 1,
      requiredQuantity: 1,
      selectedQuantity: 1,
      children: [
        {
          childLineId: "child-1",
          productId: "product-1",
          productName: "Cheese Pizza",
          variantId: "large",
          variantName: "Large",
          quantity: 1,
          configuredLineTotal: 14.99,
          childExtraTotal: 0,
          modifiers: [],
        },
      ],
    },
  ],
}

function CartHarness() {
  const {
    addDealItem,
    updateDealItem,
    removeItem,
    items,
    itemCount,
    subtotal,
  } = useCart()

  return (
    <div>
      <p data-testid="count">{itemCount}</p>
      <p data-testid="subtotal">{subtotal.toFixed(2)}</p>
      <p data-testid="items">{JSON.stringify(items)}</p>
      <button type="button" onClick={() => addDealItem(dealItem)}>
        Add deal
      </button>
      <button
        type="button"
        onClick={() =>
          updateDealItem(dealItem.cartItemId, {
            ...dealItem,
            childExtraTotal: 2,
            totalPrice: 26.99,
          })
        }
      >
        Update deal
      </button>
      <button type="button" onClick={() => removeItem(dealItem.cartItemId)}>
        Remove deal
      </button>
    </div>
  )
}

describe("CartProvider deal items", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it("adds, updates, and removes nested deal items without flattening children", () => {
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>
    )

    act(() => {
      vi.runOnlyPendingTimers()
    })

    fireEvent.click(screen.getByRole("button", { name: "Add deal" }))

    expect(screen.getByTestId("count").textContent).toBe("1")
    expect(screen.getByTestId("subtotal").textContent).toBe("24.99")
    expect(screen.getByTestId("items").textContent).toContain("Family Deal")
    expect(screen.getByTestId("items").textContent).toContain("Cheese Pizza")

    fireEvent.click(screen.getByRole("button", { name: "Update deal" }))

    expect(screen.getByTestId("subtotal").textContent).toBe("26.99")
    expect(screen.getByTestId("items").textContent).toContain(
      "childExtraTotal"
    )

    fireEvent.click(screen.getByRole("button", { name: "Remove deal" }))

    expect(screen.getByTestId("count").textContent).toBe("0")
    expect(screen.getByTestId("subtotal").textContent).toBe("0.00")
  })
})
