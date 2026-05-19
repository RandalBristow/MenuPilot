import { describe, expect, it } from "vitest"
import {
  filterModifierOptionsByVariant,
  removeUnavailableSelectedModifiers,
  type VariantModifierOptionAvailabilityRule,
} from "./filter-modifier-options-by-variant"
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
})
