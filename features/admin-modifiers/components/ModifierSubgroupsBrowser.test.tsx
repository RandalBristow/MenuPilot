import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ModifierSubgroupsBrowser } from "@/features/admin-modifiers/components/ModifierSubgroupsBrowser"
import type { ModifierCategory } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
}))

vi.mock(
  "@/features/admin-modifiers/components/ModifierGroupFormDialog",
  () => ({
    ModifierGroupFormDialog: ({
      triggerAriaLabel,
    }: {
      triggerAriaLabel?: string
    }) => <button type="button">{triggerAriaLabel}</button>,
  })
)

vi.mock(
  "@/features/admin-modifiers/components/ModifierOptionGroupFormDialog",
  () => ({
    ModifierOptionGroupFormDialog: () => null,
  })
)

const categories: ModifierCategory[] = [
  {
    id: "category-pizza",
    name: "Pizza Modifiers",
    description: null,
    sort_order: 1,
    is_enabled: true,
    modifier_groups: [
      {
        id: "group-toppings",
        name: "Pizza Toppings",
        selection_type: "multiple",
        min_required: 0,
        max_allowed: null,
        is_required: false,
        is_enabled: true,
        sort_order: 1,
        modifier_option_groups: [
          {
            id: "list-meats",
            name: "Meats",
            description: "Meat toppings",
            sort_order: 1,
            is_enabled: true,
          },
        ],
        modifier_options: [],
      },
    ],
  },
  {
    id: "category-empty",
    name: "Empty Modifiers",
    description: null,
    sort_order: 2,
    is_enabled: true,
    modifier_groups: [],
  },
]

describe("ModifierSubgroupsBrowser", () => {
  it("renders subgroups for the selected top-level group", () => {
    render(
      <ModifierSubgroupsBrowser
        categories={categories}
        businessSlug="randys-pizza"
      />
    )

    expect(
      screen.getByRole("button", { name: "Edit modifier subgroup Pizza Toppings" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Manage Option Lists" })
    ).toHaveAttribute(
      "href",
      "/businesses/randys-pizza/admin/modifiers/group-toppings"
    )
    expect(screen.queryByText("Meats")).not.toBeInTheDocument()
  })

  it("does not pretend a selected Modifier Category is a selected Modifier Group", () => {
    render(
      <ModifierSubgroupsBrowser
        categories={categories}
        businessSlug="randys-pizza"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Empty Modifiers" }))

    expect(
      screen.getByText("No subgroups found in Empty Modifiers")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Add a subgroup before creating option lists.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Add modifier subgroup" })
    ).toBeInTheDocument()
    expect(screen.queryByText("No modifier group selected")).not.toBeInTheDocument()
  })
})
