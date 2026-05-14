import { describe, expect, it } from "vitest"
import { filterEnabledModifierOptions } from "./filter-enabled-modifier-options"

type TestOption = {
  id: string
  is_enabled: boolean
  modifier_option_groups: {
    id: string
    is_enabled: boolean
  } | null
}

function getVisibleIds(options: TestOption[]) {
  return filterEnabledModifierOptions(options).map((option) => option.id)
}

describe("filterEnabledModifierOptions", () => {
  it("keeps options in enabled subgroups visible to customer configurators", () => {
    const options: TestOption[] = [
      {
        id: "hot-sauce",
        is_enabled: true,
        modifier_option_groups: {
          id: "sauces",
          is_enabled: true,
        },
      },
    ]

    expect(getVisibleIds(options)).toEqual(["hot-sauce"])
  })

  it("hides options in disabled subgroups from customer configurators", () => {
    const options: TestOption[] = [
      {
        id: "hot-sauce",
        is_enabled: true,
        modifier_option_groups: {
          id: "sauces",
          is_enabled: false,
        },
      },
    ]

    expect(getVisibleIds(options)).toEqual([])
  })

  it("keeps ungrouped enabled options visible", () => {
    const options: TestOption[] = [
      {
        id: "extra-cheese",
        is_enabled: true,
        modifier_option_groups: null,
      },
    ]

    expect(getVisibleIds(options)).toEqual(["extra-cheese"])
  })

  it("hides options inside disabled subgroups", () => {
    const options: TestOption[] = [
      {
        id: "ranch",
        is_enabled: true,
        modifier_option_groups: {
          id: "dips",
          is_enabled: false,
        },
      },
      {
        id: "blue-cheese",
        is_enabled: true,
        modifier_option_groups: {
          id: "dips",
          is_enabled: false,
        },
      },
    ]

    expect(getVisibleIds(options)).toEqual([])
  })

  it("hides disabled options even if their subgroup is enabled", () => {
    const options: TestOption[] = [
      {
        id: "pepperoni",
        is_enabled: false,
        modifier_option_groups: {
          id: "toppings",
          is_enabled: true,
        },
      },
    ]

    expect(getVisibleIds(options)).toEqual([])
  })

  it("does not mutate admin data that includes disabled subgroups and options", () => {
    const adminOptions: TestOption[] = [
      {
        id: "enabled-ungrouped",
        is_enabled: true,
        modifier_option_groups: null,
      },
      {
        id: "disabled-option",
        is_enabled: false,
        modifier_option_groups: {
          id: "enabled-subgroup",
          is_enabled: true,
        },
      },
      {
        id: "hidden-by-subgroup",
        is_enabled: true,
        modifier_option_groups: {
          id: "disabled-subgroup",
          is_enabled: false,
        },
      },
    ]

    expect(getVisibleIds(adminOptions)).toEqual(["enabled-ungrouped"])
    expect(adminOptions.map((option) => option.id)).toEqual([
      "enabled-ungrouped",
      "disabled-option",
      "hidden-by-subgroup",
    ])
    expect(
      adminOptions.some(
        (option) => option.modifier_option_groups?.is_enabled === false
      )
    ).toBe(true)
    expect(adminOptions.some((option) => option.is_enabled === false)).toBe(
      true
    )
  })
})
