import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ProductModifierGroupsClient } from "./ProductModifierGroupsClient"
import type { ProductModifierGroupManagementData } from "@/features/admin-products/queries/get-product-management-data"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

vi.mock("@/features/admin-products/actions/save-product-included-modifier-group", () => ({
  saveProductIncludedModifierGroupAction: vi.fn(),
}))

vi.mock("@/features/admin-products/actions/save-product-modifier-group-assignment", () => ({
  attachProductModifierGroup: vi.fn(),
  detachProductModifierGroup: vi.fn(),
}))

function buildData(
  overrides: Partial<ProductModifierGroupManagementData> = {}
): ProductModifierGroupManagementData {
  return {
    businessName: "Randy's Pizza & Pub",
    menuGroups: [],
    mediaAssets: [],
    modifierGroups: [],
    product: null,
    products: [
      {
        id: "product-meat",
        name: "Meat Pizza",
        is_enabled: true,
        menuGroupId: null,
      },
    ],
    selectedProductId: "product-meat",
    selectedProductName: "Meat Pizza",
    modifierCategories: [
      {
        id: "category-pizza",
        name: "Pizza",
        description: null,
        is_enabled: true,
        sort_order: 1,
        modifier_groups: [
          {
            id: "group-toppings",
            name: "Pizza Toppings",
            selection_type: "multiple",
            is_required: false,
            is_enabled: true,
            sort_order: 1,
          },
        ],
      },
    ],
    modifierAssignments: [
      {
        id: "assignment-toppings",
        product_id: "product-meat",
        modifier_group_id: "group-toppings",
        is_enabled: true,
        sort_order: 1,
        includedRule: null,
      },
    ],
    defaultModifierOptions: Array.from({ length: 5 }, (_, index) => ({
      id: `default-${index}`,
      product_id: "product-meat",
      modifier_group_id: "group-toppings",
      modifier_option_id: `option-${index}`,
      is_enabled: true,
    })),
    ...overrides,
  }
}

describe("ProductModifierGroupsClient", () => {
  it("renders a pricing warning on assigned modifier groups with too many defaults", () => {
    render(
      <ProductModifierGroupsClient
        data={buildData()}
        businessSlug="randys-pizza"
      />
    )

    expect(screen.getByText(/pricing warning/i)).toBeInTheDocument()
    expect(screen.getByText(/5 defaults selected/i)).toBeInTheDocument()
    expect(screen.getByText(/0 included selections/i)).toBeInTheDocument()
  })
})
