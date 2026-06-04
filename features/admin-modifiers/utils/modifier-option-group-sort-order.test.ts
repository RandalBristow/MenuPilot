import { describe, expect, it } from "vitest"
import {
  getNextModifierOptionGroupSortOrder,
  sortModifierOptionGroups,
} from "./modifier-option-group-sort-order"

describe("modifier option group sort order", () => {
  it("next available returns 1 when a modifier group has no option lists", () => {
    expect(getNextModifierOptionGroupSortOrder({ optionGroups: [] })).toBe(1)
  })

  it("next available returns max plus 1 for the current modifier group option lists", () => {
    expect(
      getNextModifierOptionGroupSortOrder({
        optionGroups: [
          { name: "Meats", sort_order: 1 },
          { name: "Cheeses", sort_order: 3 },
          { name: "Veggies", sort_order: 2 },
        ],
      })
    ).toBe(4)
  })

  it("sorts option lists by sort_order within a modifier group", () => {
    expect(
      sortModifierOptionGroups([
        { name: "Cheeses", sort_order: 3 },
        { name: "Meats", sort_order: 1 },
        { name: "Veggies", sort_order: 2 },
      ]).map((optionGroup) => optionGroup.name)
    ).toEqual(["Meats", "Veggies", "Cheeses"])
  })

  it("uses name as a stable tie breaker", () => {
    expect(
      sortModifierOptionGroups([
        { name: "Veggies", sort_order: 1 },
        { name: "Meats", sort_order: 1 },
      ]).map((optionGroup) => optionGroup.name)
    ).toEqual(["Meats", "Veggies"])
  })
})
