import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { PublicSpecial } from "@/features/specials/types/public-special"
import { MenuPage } from "./MenuPage"

const menu = {
  id: "menu-a",
  name: "Main Menu",
  description: null,
  menu_groups: [
    {
      id: "category-a",
      name: "Pizza",
      slug: "pizza",
      description: null,
      parent_group_id: null,
      sort_order: 1,
      display_style: "grid",
      product_groups: [],
    },
  ],
}

const menuWithProduct = {
  ...menu,
  menu_groups: [
    ...menu.menu_groups,
    {
      id: "subcategory-a",
      name: "Specialty Pizza",
      slug: "specialty-pizza",
      description: null,
      parent_group_id: "category-a",
      sort_order: 1,
      display_style: "grid",
      product_groups: [
        {
          id: "product-group-a",
          sort_order: 1,
          products: {
            id: "product-a",
            name: "Deluxe Pizza",
            slug: "deluxe-pizza",
            description: null,
            base_price: 12,
            builder_template: "pizza",
            has_variants: false,
            is_featured: false,
            is_enabled: true,
            variants: [],
          },
        },
      ],
    },
  ],
}

function buildSpecial(
  overrides: Partial<PublicSpecial> = {}
): PublicSpecial {
  return {
    id: "special-a",
    businessId: "business-a",
    name: "Pizza Night",
    customerDescription: "Save on selected pizzas.",
    specialType: "line_discount",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    eligibleProducts: [],
    eligibleMenuGroupIds: [],
    availabilityWindows: [],
    ...overrides,
  }
}

describe("MenuPage", () => {
  it("shows setup preview messaging when supplied", () => {
    render(
      <MenuPage
        businessName="Randy's Pizza & Pub"
        menu={menu}
        previewMessage="Preview mode: this business is in setup and is not accepting public orders."
      />
    )

    expect(screen.getAllByText("Randy's Pizza & Pub")[0]).toBeInTheDocument()
    expect(
      screen.getByText(
        "Preview mode: this business is in setup and is not accepting public orders."
      )
    ).toBeInTheDocument()
  })

  it("does not show setup preview messaging for active menus", () => {
    render(<MenuPage businessName="Pronto Demo Pizza & Carryout" menu={menu} />)

    expect(
      screen.queryByText(/not accepting public orders/i)
    ).not.toBeInTheDocument()
  })

  it("disables customer ordering actions for setup preview menus", () => {
    render(
      <MenuPage
        businessName="Randy's Pizza & Pub"
        menu={menuWithProduct}
        orderingActionsDisabled
      />
    )

    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Preview only" })
    ).toBeDisabled()
  })

  it("does not show the specials section when no active specials exist", () => {
    render(<MenuPage businessName="Pronto Demo Pizza & Carryout" menu={menu} />)

    expect(screen.queryByText("Current Specials")).not.toBeInTheDocument()
  })

  it("shows active specials in the public menu specials section", () => {
    render(
      <MenuPage
        businessName="Pronto Demo Pizza & Carryout"
        menu={menu}
        activeSpecials={[
          buildSpecial({
            name: "Family Night",
            discountType: "fixed_amount",
            discountValue: 5,
            specialType: "cart_discount",
          }),
        ]}
      />
    )

    expect(screen.getByText("Current Specials")).toBeInTheDocument()
    expect(screen.getByText("Family Night")).toBeInTheDocument()
    expect(screen.getByText("$5.00 off")).toBeInTheDocument()
    expect(
      screen.getByText("Save on selected pizzas.")
    ).toBeInTheDocument()
  })

  it("shows product badges for eligible line specials", () => {
    render(
      <MenuPage
        businessName="Pronto Demo Pizza & Carryout"
        menu={menuWithProduct}
        activeSpecials={[
          buildSpecial({
            eligibleProducts: [{ productId: "product-a" }],
          }),
        ]}
      />
    )

    expect(screen.getByText("Special: 20% off")).toBeInTheDocument()
  })

  it("does not show product badges for cart-level specials", () => {
    render(
      <MenuPage
        businessName="Pronto Demo Pizza & Carryout"
        menu={menuWithProduct}
        activeSpecials={[
          buildSpecial({
            specialType: "cart_discount",
            discountType: "fixed_amount",
            discountValue: 5,
          }),
        ]}
      />
    )

    expect(screen.getByText("Current Specials")).toBeInTheDocument()
    expect(screen.queryByText(/^Special:/)).not.toBeInTheDocument()
  })

  it("shows a build action for active orderable deals", () => {
    const onBuildDeal = vi.fn()

    render(
      <MenuPage
        businessName="Pronto Demo Pizza & Carryout"
        menu={menu}
        activeSpecials={[
          buildSpecial({
            id: "deal-a",
            name: "Family Deal",
            specialType: "orderable_deal",
            discountType: "fixed_price",
            discountValue: 24.99,
          }),
        ]}
        onBuildDeal={onBuildDeal}
      />
    )

    expect(screen.getByText("Family Deal")).toBeInTheDocument()
    expect(screen.getByText("Deal $24.99")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Build Deal" }))

    expect(onBuildDeal).toHaveBeenCalledWith("deal-a")
  })

  it("shows a build action for active Mix & Match deals", () => {
    const onBuildDeal = vi.fn()

    render(
      <MenuPage
        businessName="Pronto Demo Pizza & Carryout"
        menu={menu}
        activeSpecials={[
          buildSpecial({
            id: "mix-a",
            name: "Any 2 Subs",
            specialType: "mix_and_match_fixed_unit_price",
            discountType: "fixed_price",
            discountValue: 0,
            mixRule: {
              minQuantity: 2,
              maxQuantity: null,
              unitPrice: 7.99,
              allowExtraItems: true,
            },
            mixProductCount: 5,
          }),
        ]}
        onBuildDeal={onBuildDeal}
      />
    )

    expect(screen.getByText("Any 2 Subs")).toBeInTheDocument()
    expect(screen.getByText("Mix & Match")).toBeInTheDocument()
    expect(
      screen.getByText("Any 2+ for $7.99 each. 5 eligible items.")
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Build Mix & Match" }))

    expect(onBuildDeal).toHaveBeenCalledWith("mix-a")
  })
})
