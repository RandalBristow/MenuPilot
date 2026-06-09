import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { SpecialFormFields } from "./SpecialFormFields"
import type { SpecialAdminFormData } from "@/features/specials/queries/get-specials-admin-data"

function buildProduct({
  id,
  name,
  categoryId,
  categoryName,
  categorySort,
  subcategoryId,
  subcategoryName,
  subcategorySort,
  isEnabled = true,
  variants = [],
  modifierGroups = [],
}: {
  id: string
  name: string
  categoryId: string
  categoryName: string
  categorySort: number
  subcategoryId: string
  subcategoryName: string
  subcategorySort: number
  isEnabled?: boolean
  variants?: SpecialAdminFormData["products"][number]["variants"]
  modifierGroups?: NonNullable<
    SpecialAdminFormData["products"][number]["modifierGroups"]
  >
}): SpecialAdminFormData["products"][number] {
  return {
    id,
    name,
    description: null,
    isEnabled,
    builderTemplate: null,
    menuGroupId: subcategoryId,
    menuGroupName: subcategoryName,
    menuGroupSortOrder: subcategorySort,
    parentMenuGroupId: categoryId,
    parentMenuGroupName: categoryName,
    parentMenuGroupSortOrder: categorySort,
    variants,
    modifierGroups,
  }
}

function buildData(
  overrides: Partial<SpecialAdminFormData> = {}
): SpecialAdminFormData {
  return {
    business: {
      id: "business-a",
      name: "Randy's Pizza",
      slug: "randys-pizza",
    },
    special: null,
    products: [
      buildProduct({
        id: "product-a",
        name: "Deluxe Pizza",
        categoryId: "category-pizza",
        categoryName: "Pizza",
        categorySort: 1,
        subcategoryId: "subcategory-specialty",
        subcategoryName: "Specialty",
        subcategorySort: 2,
        variants: [
          { id: "variant-large", name: "14 inch", isEnabled: true, sortOrder: 1 },
          { id: "variant-small", name: "10 inch", isEnabled: true, sortOrder: 2 },
        ],
        modifierGroups: [
          {
            id: "modifier-toppings",
            name: "Pizza Toppings",
            isEnabled: true,
            isAssignmentEnabled: true,
            sortOrder: 1,
            includedQuantity: 0,
          },
        ],
      }),
      buildProduct({
        id: "product-b",
        name: "Meat Pizza",
        categoryId: "category-pizza",
        categoryName: "Pizza",
        categorySort: 1,
        subcategoryId: "subcategory-specialty",
        subcategoryName: "Specialty",
        subcategorySort: 2,
      }),
      buildProduct({
        id: "product-c",
        name: "Pepsi 2-Liter",
        categoryId: "category-drinks",
        categoryName: "Drinks",
        categorySort: 2,
        subcategoryId: "subcategory-2-liters",
        subcategoryName: "2-Liters",
        subcategorySort: 1,
        variants: [
          { id: "variant-20oz", name: "20 oz", isEnabled: true, sortOrder: 1 },
          { id: "variant-2-liter", name: "2 Liter", isEnabled: true, sortOrder: 2 },
        ],
      }),
      buildProduct({
        id: "product-d",
        name: "Garlic Bread",
        categoryId: "category-breads",
        categoryName: "Breads",
        categorySort: 3,
        subcategoryId: "subcategory-breads",
        subcategoryName: "Breads",
        subcategorySort: 1,
      }),
    ],
    menuGroups: [
      {
        id: "menu-group-a",
        name: "Pizza",
        description: null,
        isEnabled: true,
        parentGroupId: null,
      },
    ],
    ...overrides,
  }
}

function getProductToggle(name: RegExp) {
  const productButton = screen
    .getAllByRole("button", { name })
    .find((button) => button.hasAttribute("aria-pressed"))

  if (!productButton) {
    throw new Error(`Could not find product toggle ${name}`)
  }

  return productButton
}

function openSubcategory(name: string) {
  const trigger =
    screen
      .getAllByRole("button", { name: new RegExp(name) })
      .find((button) => button.hasAttribute("aria-expanded")) ??
    screen.getByRole("button", { name: new RegExp(name) })

  if (trigger.getAttribute("aria-expanded") === "false") {
    fireEvent.click(trigger)
  }
}

function openAccordion(name: RegExp) {
  const trigger = screen.getByRole("button", { name })

  if (trigger.getAttribute("aria-expanded") === "false") {
    fireEvent.click(trigger)
  }
}

describe("SpecialFormFields", () => {
  it("shows orderable deal mode and relabels passive fields", () => {
    render(<SpecialFormFields data={buildData()} businessSlug="randys-pizza" />)

    expect(screen.getByRole("option", { name: "Orderable deal" })).toBeInTheDocument()

    fireEvent.change(screen.getByRole("combobox", { name: /special type/i }), {
      target: { value: "orderable_deal" },
    })

    expect(screen.getByText("Deal base price")).toBeInTheDocument()
    expect(screen.queryByText("Discount type")).not.toBeInTheDocument()
    expect(screen.queryByText("Minimum order amount")).not.toBeInTheDocument()
    expect(screen.queryByText("Eligible products")).not.toBeInTheDocument()
    expect(screen.getByText("Deal components")).toBeInTheDocument()
  })

  it("adds and removes deal components and allows product selection", () => {
    render(<SpecialFormFields data={buildData()} businessSlug="randys-pizza" />)

    fireEvent.change(screen.getByRole("combobox", { name: /special type/i }), {
      target: { value: "orderable_deal" },
    })
    openAccordion(/Deal components/)
    fireEvent.click(screen.getByRole("button", { name: /add component/i }))

    expect(screen.getByText("Component 2")).toBeInTheDocument()

    openAccordion(/^Component 1/)
    openSubcategory("Specialty")
    fireEvent.click(getProductToggle(/Deluxe Pizza/))

    const selectedProduct = getProductToggle(/Deluxe Pizza/)
    expect(selectedProduct).toHaveAttribute("aria-pressed", "true")

    fireEvent.click(screen.getByLabelText("Remove component 2"))

    expect(screen.queryByText("Component 2")).not.toBeInTheDocument()
  })

  it("renders existing orderable deal components", () => {
    render(
      <SpecialFormFields
        businessSlug="randys-pizza"
        data={buildData({
          special: {
            id: "special-a",
            name: "Family Deal",
            description: null,
            customerDescription: null,
            specialType: "orderable_deal",
            discountType: "fixed_price",
            discountValue: 29.99,
            minOrderAmount: null,
            startsAt: null,
            endsAt: null,
            isEnabled: false,
            status: "disabled",
            eligibilitySummary: "1 component",
            scheduleSummary: "No date limit",
            availabilityWindows: [],
            productIds: [],
            menuGroupIds: [],
            components: [
              {
                id: "component-a",
                label: "Choose a pizza",
                description: "Any pizza",
                sortOrder: 1,
                requiredQuantity: 1,
                minQuantity: 1,
                maxQuantity: 1,
                pricingBehavior: "included_base",
                pricingMode: "fixed_price",
                fixedPrice: 7.99,
                isRequired: true,
                productIds: ["product-a"],
                productVariantRestrictions: [
                  {
                    productId: "product-a",
                    allowedVariantOptionIds: ["variant-large"],
                  },
                ],
                modifierGroupOverrides: [
                  {
                    productId: "product-a",
                    modifierGroupId: "modifier-toppings",
                    includedSelectionCount: 2,
                  },
                ],
              },
            ],
            mixMatchRule: null,
          },
        })}
      />
    )

    expect(screen.getByDisplayValue("Choose a pizza")).toBeInTheDocument()
    openAccordion(/Deal components/)
    openAccordion(/^Component 1/)
    expect(screen.getByDisplayValue("fixed_price")).toBeInTheDocument()
    expect(screen.getByDisplayValue("7.99")).toBeInTheDocument()
    openSubcategory("Specialty")
    expect(getProductToggle(/Deluxe Pizza/)).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByLabelText("14 inch")).toBeChecked()
    expect(screen.getByDisplayValue("2")).toBeInTheDocument()
    expect(screen.getByText("Deal modifier overrides")).toBeInTheDocument()
    expect(screen.getByText(/Product default: 0 included/)).toBeInTheDocument()
  })

  it("shows fixed price only for fixed-price orderable deal components", () => {
    render(<SpecialFormFields data={buildData()} businessSlug="randys-pizza" />)

    fireEvent.change(screen.getByRole("combobox", { name: /special type/i }), {
      target: { value: "orderable_deal" },
    })
    openAccordion(/Deal components/)
    openAccordion(/^Component 1/)

    expect(screen.getByText("Pricing mode")).toBeInTheDocument()
    expect(screen.queryByText("Fixed price")).not.toBeInTheDocument()

    fireEvent.change(screen.getByRole("combobox", { name: /pricing mode/i }), {
      target: { value: "fixed_price" },
    })

    expect(screen.getByText("Fixed price")).toBeInTheDocument()
    expect(
      screen.getByText(/fixed price instead of the product's normal base price/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("option", { name: /normal product price/i })
    ).not.toBeInTheDocument()
  })

  it("shows variant restriction controls for selected products", () => {
    render(<SpecialFormFields data={buildData()} businessSlug="randys-pizza" />)

    fireEvent.change(screen.getByRole("combobox", { name: /special type/i }), {
      target: { value: "orderable_deal" },
    })
    openAccordion(/Deal components/)
    openAccordion(/^Component 1/)
    fireEvent.click(screen.getByRole("button", { name: "Drinks" }))
    openSubcategory("2-Liters")
    fireEvent.click(screen.getByRole("button", { name: /Pepsi 2-Liter/ }))

    expect(screen.getByText("All variants allowed.")).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText("2 Liter"))

    expect(screen.getByText("2 Liter only.")).toBeInTheDocument()
  })

  it("shows only one selected product category instead of an all-products view", () => {
    render(<SpecialFormFields data={buildData()} businessSlug="randys-pizza" />)

    fireEvent.change(screen.getByRole("combobox", { name: /special type/i }), {
      target: { value: "orderable_deal" },
    })

    openAccordion(/Deal components/)
    openAccordion(/^Component 1/)
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument()
    expect(screen.getByText("Specialty")).toBeInTheDocument()
    openSubcategory("Specialty")
    expect(
      screen.getByRole("button", { name: /Deluxe Pizza/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Pepsi 2-Liter/ })
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Drinks" }))

    expect(screen.getByText("2-Liters")).toBeInTheDocument()
    openSubcategory("2-Liters")
    expect(screen.getByRole("button", { name: /Pepsi 2-Liter/ })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Deluxe Pizza/ })
    ).not.toBeInTheDocument()
  })

  it("selects and clears all visible products in a subcategory", () => {
    render(<SpecialFormFields data={buildData()} businessSlug="randys-pizza" />)

    fireEvent.change(screen.getByRole("combobox", { name: /special type/i }), {
      target: { value: "orderable_deal" },
    })

    openAccordion(/Deal components/)
    openAccordion(/^Component 1/)
    openSubcategory("Specialty")
    fireEvent.click(screen.getAllByRole("button", { name: "Select visible" })[0])

    expect(screen.getAllByText(/2 allowed products/)[0]).toBeInTheDocument()
    expect(getProductToggle(/Deluxe Pizza/)).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(getProductToggle(/Meat Pizza/)).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    fireEvent.click(screen.getAllByRole("button", { name: "Clear visible" })[0])

    expect(screen.getAllByText("0 allowed products")[0]).toBeInTheDocument()
  })

  it("keeps passive special product eligibility as checkboxes", () => {
    render(<SpecialFormFields data={buildData()} businessSlug="randys-pizza" />)

    expect(screen.getByText("Eligible products")).toBeInTheDocument()
    expect(screen.getByLabelText(/Pepsi 2-Liter/)).toBeInTheDocument()
  })

  it("shows mix and match fields without passive or component editors", () => {
    render(<SpecialFormFields data={buildData()} businessSlug="randys-pizza" />)

    fireEvent.change(screen.getByRole("combobox", { name: /special type/i }), {
      target: { value: "mix_and_match_fixed_unit_price" },
    })

    expect(screen.getByRole("button", { name: /Mix & Match/ })).toBeInTheDocument()
    expect(screen.queryByText("Discount type")).not.toBeInTheDocument()
    expect(screen.queryByText("Minimum order amount")).not.toBeInTheDocument()
    expect(screen.queryByText("Eligible products")).not.toBeInTheDocument()
    expect(screen.queryByText("Deal components")).not.toBeInTheDocument()

    openAccordion(/Mix & Match/)

    expect(screen.getByText("Min qty required")).toBeInTheDocument()
    expect(screen.getByText("Max qty optional")).toBeInTheDocument()
    expect(screen.getByText("Unit price")).toBeInTheDocument()
    expect(screen.getByText("Mix pool products")).toBeInTheDocument()
    expect(
      screen.getByText(/Free attached items, such as plus a free 2-liter/)
    ).toBeInTheDocument()
  })

  it("renders existing mix and match pool restrictions and overrides", () => {
    render(
      <SpecialFormFields
        businessSlug="randys-pizza"
        data={buildData({
          special: {
            id: "special-mix",
            name: "Any 2 Pizzas",
            description: null,
            customerDescription: null,
            specialType: "mix_and_match_fixed_unit_price",
            discountType: "fixed_price",
            discountValue: 7.99,
            minOrderAmount: null,
            startsAt: null,
            endsAt: null,
            isEnabled: false,
            status: "disabled",
            eligibilitySummary: "1 pool product",
            scheduleSummary: "No date limit",
            availabilityWindows: [],
            productIds: [],
            menuGroupIds: [],
            components: [],
            mixMatchRule: {
              id: "mix-rule",
              minQuantity: 2,
              maxQuantity: 4,
              unitPrice: 7.99,
              allowExtraItems: true,
              productIds: ["product-a"],
              productVariantRestrictions: [
                {
                  productId: "product-a",
                  allowedVariantOptionIds: ["variant-large"],
                },
              ],
              modifierGroupOverrides: [
                {
                  productId: "product-a",
                  modifierGroupId: "modifier-toppings",
                  includedSelectionCount: 0,
                },
              ],
            },
          },
        })}
      />
    )

    openAccordion(/Mix & Match/)
    openSubcategory("Specialty")

    expect(screen.getByDisplayValue("2")).toBeInTheDocument()
    expect(screen.getByDisplayValue("4")).toBeInTheDocument()
    expect(screen.getByDisplayValue("7.99")).toBeInTheDocument()
    expect(getProductToggle(/Deluxe Pizza/)).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByLabelText("14 inch")).toBeChecked()
    expect(screen.getByText("Deal modifier overrides")).toBeInTheDocument()
    expect(screen.getByDisplayValue("0")).toBeInTheDocument()
  })
})
