import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
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
})
