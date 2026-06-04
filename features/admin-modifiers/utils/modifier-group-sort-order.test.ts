import { describe, expect, it } from "vitest"
import {
  getNextModifierGroupSortOrder,
  sortModifierGroups,
} from "./modifier-group-sort-order"

describe("modifier group sort order", () => {
  it("next available returns 1 when a category has no modifier groups", () => {
    expect(getNextModifierGroupSortOrder({ modifierGroups: [] })).toBe(1)
  })

  it("next available returns max plus 1 within the current modifier category", () => {
    expect(
      getNextModifierGroupSortOrder({
        modifierGroups: [
          { name: "Crust Type", sort_order: 1 },
          { name: "Pizza Sauce", sort_order: 3 },
          { name: "Crust Style", sort_order: 2 },
        ],
      })
    ).toBe(4)
  })

  it("sorts modifier groups by sort_order within the current modifier category", () => {
    expect(
      sortModifierGroups([
        { name: "Pizza Sauce", sort_order: 3 },
        { name: "Crust Type", sort_order: 1 },
        { name: "Crust Style", sort_order: 2 },
      ]).map((modifierGroup) => modifierGroup.name)
    ).toEqual(["Crust Type", "Crust Style", "Pizza Sauce"])
  })

  it("uses name as a stable tie breaker", () => {
    expect(
      sortModifierGroups([
        { name: "Pizza Toppings", sort_order: 4 },
        { name: "Pizza Sauce", sort_order: 4 },
      ]).map((modifierGroup) => modifierGroup.name)
    ).toEqual(["Pizza Sauce", "Pizza Toppings"])
  })
})
