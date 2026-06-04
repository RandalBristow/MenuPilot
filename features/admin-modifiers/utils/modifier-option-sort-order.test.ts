import { describe, expect, it } from "vitest"
import {
  getNextModifierOptionSortOrder,
  sortModifierOptionsWithinList,
} from "./modifier-option-sort-order"

const options = [
  {
    id: "tomato",
    name: "Tomato",
    sort_order: 1,
    modifier_option_group_id: "veggies",
  },
  {
    id: "cucumber",
    name: "Cucumber",
    sort_order: 3,
    modifier_option_group_id: "veggies",
  },
  {
    id: "onion",
    name: "Onion",
    sort_order: 2,
    modifier_option_group_id: "veggies",
  },
  {
    id: "cheddar",
    name: "Cheddar",
    sort_order: 20,
    modifier_option_group_id: "cheeses",
  },
]

describe("modifier option sort order", () => {
  it("next available returns 1 for an empty option group", () => {
    expect(
      getNextModifierOptionSortOrder({
        options,
        modifierOptionGroupId: "crunch",
      })
    ).toBe(1)
  })

  it("next available returns max + 1 within the same modifier_option_group_id", () => {
    expect(
      getNextModifierOptionSortOrder({
        options,
        modifierOptionGroupId: "veggies",
      })
    ).toBe(4)
  })

  it("sibling option groups do not affect next available", () => {
    expect(
      getNextModifierOptionSortOrder({
        options,
        modifierOptionGroupId: "cheeses",
      })
    ).toBe(21)
  })

  it("list ordering uses sort_order within the current option group", () => {
    expect(
      sortModifierOptionsWithinList(
        options.filter((option) => option.modifier_option_group_id === "veggies")
      ).map((option) => option.id)
    ).toEqual(["tomato", "onion", "cucumber"])
  })
})

