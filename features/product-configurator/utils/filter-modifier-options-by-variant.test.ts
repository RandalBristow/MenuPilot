import { describe, expect, it } from "vitest"
import {
  filterModifierOptionsByVariant,
  isModifierOptionAvailableForVariant,
  removeUnavailableSelectedModifiers,
  type VariantModifierOptionAvailabilityRule,
} from "./filter-modifier-options-by-variant"
import { filterEnabledModifierOptions } from "./filter-enabled-modifier-options"
import { getModifierGroupValidationMessage } from "./modifier-group-validation"

const crustGroup = {
  id: "crust",
  is_required: true,
  min_required: 1,
  max_allowed: 1,
  modifier_options: [
    { id: "regular-crust", name: "Regular" },
    { id: "gluten-free-crust", name: "Gluten Free" },
  ],
}

function filterForVariant(
  variantId: string,
  rules: VariantModifierOptionAvailabilityRule[]
) {
  return filterModifierOptionsByVariant({
    selectedVariantId: variantId,
    modifierGroups: [crustGroup],
    availabilityRules: rules,
  })[0]
}

describe("filterModifierOptionsByVariant", () => {
  it("keeps options available when no rule exists", () => {
    const filteredGroup = filterForVariant("size-12", [])

    expect(filteredGroup.modifier_options.map((option) => option.id)).toEqual([
      "regular-crust",
      "gluten-free-crust",
    ])
  })

  it("reports an option available when no rule exists for the selected variant", () => {
    expect(
      isModifierOptionAvailableForVariant({
        selectedVariantId: "size-12",
        modifierGroupId: "crust",
        modifierOptionId: "gluten-free-crust",
        availabilityRules: [],
      })
    ).toBe(true)
  })

  it("hides an option when an enabled unavailable rule matches", () => {
    const filteredGroup = filterForVariant("size-12", [
      {
        variant_group_option_id: "size-12",
        modifier_group_id: "crust",
        modifier_option_id: "gluten-free-crust",
        is_available: false,
        is_enabled: true,
      },
    ])

    expect(filteredGroup.modifier_options.map((option) => option.id)).toEqual([
      "regular-crust",
    ])
  })

  it("reports an option unavailable when an enabled unavailable rule matches", () => {
    expect(
      isModifierOptionAvailableForVariant({
        selectedVariantId: "size-12",
        modifierGroupId: "crust",
        modifierOptionId: "gluten-free-crust",
        availabilityRules: [
          {
            variant_group_option_id: "size-12",
            modifier_group_id: "crust",
            modifier_option_id: "gluten-free-crust",
            is_available: false,
            is_enabled: true,
          },
        ],
      })
    ).toBe(false)
  })

  it("ignores disabled rules", () => {
    const filteredGroup = filterForVariant("size-12", [
      {
        variant_group_option_id: "size-12",
        modifier_group_id: "crust",
        modifier_option_id: "gluten-free-crust",
        is_available: false,
        is_enabled: false,
      },
    ])

    expect(filteredGroup.modifier_options.map((option) => option.id)).toContain(
      "gluten-free-crust"
    )
  })

  it("reports disabled unavailable rules as available", () => {
    expect(
      isModifierOptionAvailableForVariant({
        selectedVariantId: "size-12",
        modifierGroupId: "crust",
        modifierOptionId: "gluten-free-crust",
        availabilityRules: [
          {
            variant_group_option_id: "size-12",
            modifier_group_id: "crust",
            modifier_option_id: "gluten-free-crust",
            is_available: false,
            is_enabled: false,
          },
        ],
      })
    ).toBe(true)
  })

  it("keeps an option when an enabled available rule matches", () => {
    const filteredGroup = filterForVariant("size-10", [
      {
        variant_group_option_id: "size-10",
        modifier_group_id: "crust",
        modifier_option_id: "gluten-free-crust",
        is_available: true,
        is_enabled: true,
      },
    ])

    expect(filteredGroup.modifier_options.map((option) => option.id)).toContain(
      "gluten-free-crust"
    )
  })

  it("does not apply a rule to the same option in another modifier group", () => {
    const [crust, sauces] = filterModifierOptionsByVariant({
      selectedVariantId: "size-12",
      modifierGroups: [
        crustGroup,
        {
          id: "sauces",
          is_required: false,
          min_required: 0,
          max_allowed: null,
          modifier_options: [
            { id: "gluten-free-crust", name: "Shared Option Id" },
            { id: "ranch", name: "Ranch" },
          ],
        },
      ],
      availabilityRules: [
        {
          variant_group_option_id: "size-12",
          modifier_group_id: "crust",
          modifier_option_id: "gluten-free-crust",
          is_available: false,
          is_enabled: true,
        },
      ],
    })

    expect(crust.modifier_options.map((option) => option.id)).toEqual([
      "regular-crust",
    ])
    expect(sauces.modifier_options.map((option) => option.id)).toEqual([
      "gluten-free-crust",
      "ranch",
    ])
  })

  it("hides only the matching group option for the selected variant", () => {
    const [size10Group, size12Group] = [
      filterForVariant("size-10", [
        {
          variant_group_option_id: "size-12",
          modifier_group_id: "crust",
          modifier_option_id: "gluten-free-crust",
          is_available: false,
          is_enabled: true,
        },
      ]),
      filterForVariant("size-12", [
        {
          variant_group_option_id: "size-12",
          modifier_group_id: "crust",
          modifier_option_id: "gluten-free-crust",
          is_available: false,
          is_enabled: true,
        },
      ]),
    ]

    expect(size10Group.modifier_options.map((option) => option.id)).toContain(
      "gluten-free-crust"
    )
    expect(size12Group.modifier_options.map((option) => option.id)).toEqual([
      "regular-crust",
    ])
  })

  it("keeps an option available for another variant when only the selected variant allows it", () => {
    const size10Group = filterForVariant("size-10", [
      {
        variant_group_option_id: "size-10",
        modifier_group_id: "crust",
        modifier_option_id: "gluten-free-crust",
        is_available: true,
        is_enabled: true,
      },
      {
        variant_group_option_id: "size-12",
        modifier_group_id: "crust",
        modifier_option_id: "gluten-free-crust",
        is_available: false,
        is_enabled: true,
      },
    ])

    expect(size10Group.modifier_options.map((option) => option.id)).toContain(
      "gluten-free-crust"
    )
  })

  it("removes selected modifiers that are unavailable after a variant change", () => {
    const filteredGroup = filterForVariant("size-12", [
      {
        variant_group_option_id: "size-12",
        modifier_group_id: "crust",
        modifier_option_id: "gluten-free-crust",
        is_available: false,
        is_enabled: true,
      },
    ])

    expect(
      removeUnavailableSelectedModifiers({
        selectedModifiers: {
          "gluten-free-crust": { optionId: "gluten-free-crust" },
          "regular-crust": { optionId: "regular-crust" },
        },
        modifierGroups: [filteredGroup],
      })
    ).toEqual({
      "regular-crust": { optionId: "regular-crust" },
    })
  })

  it("does not block required group validation when no options are available", () => {
    const emptyRequiredGroup = filterForVariant("size-12", [
      {
        variant_group_option_id: "size-12",
        modifier_group_id: "crust",
        modifier_option_id: "regular-crust",
        is_available: false,
        is_enabled: true,
      },
      {
        variant_group_option_id: "size-12",
        modifier_group_id: "crust",
        modifier_option_id: "gluten-free-crust",
        is_available: false,
        is_enabled: true,
      },
    ])

    expect(getModifierGroupValidationMessage(emptyRequiredGroup, [])).toBeNull()
  })

  it("still requires a selection when a required group has available options", () => {
    const filteredGroup = filterForVariant("size-12", [
      {
        variant_group_option_id: "size-12",
        modifier_group_id: "crust",
        modifier_option_id: "gluten-free-crust",
        is_available: false,
        is_enabled: true,
      },
    ])

    expect(getModifierGroupValidationMessage(filteredGroup, [])).toBe(
      "Please choose at least 1."
    )
  })

  it("filters mixed grouped and ungrouped options without crashing", () => {
    const modifierGroups = [
      {
        id: "toppings",
        is_required: false,
        min_required: 0,
        max_allowed: null,
        modifier_options: filterEnabledModifierOptions([
          {
            id: "pepperoni",
            name: "Pepperoni",
            is_enabled: true,
            modifier_option_group_id: "meats",
            modifier_option_groups: {
              id: "meats",
              is_enabled: true,
            },
          },
          {
            id: "ranch",
            name: "Ranch",
            is_enabled: true,
            modifier_option_group_id: null,
            modifier_option_groups: null,
          },
          {
            id: "hidden-cheese",
            name: "Hidden Cheese",
            is_enabled: true,
            modifier_option_group_id: "disabled-cheeses",
            modifier_option_groups: {
              id: "disabled-cheeses",
              is_enabled: false,
            },
          },
        ]),
      },
    ]

    const [filteredGroup] = filterModifierOptionsByVariant({
      selectedVariantId: "size-12",
      modifierGroups,
      availabilityRules: [
        {
          variant_group_option_id: "size-12",
          modifier_group_id: "toppings",
          modifier_option_id: "pepperoni",
          is_available: false,
          is_enabled: true,
        },
      ],
    })

    expect(filteredGroup.modifier_options.map((option) => option.id)).toEqual([
      "ranch",
    ])
  })
})
