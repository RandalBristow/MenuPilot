import { describe, expect, it } from "vitest"
import { groupModifierOptionsByOptionGroup } from "./group-modifier-options-by-option-group"

describe("groupModifierOptionsByOptionGroup", () => {
  it("groups options by enabled option group and keeps ungrouped options separate", () => {
    const grouped = groupModifierOptionsByOptionGroup([
      {
        id: "ranch",
        name: "Ranch",
        sort_order: 2,
        modifier_option_group_id: "dressings",
        modifier_option_groups: {
          id: "dressings",
          name: "Dressings",
          description: null,
          is_enabled: true,
          sort_order: 2,
        },
      },
      {
        id: "croutons",
        name: "Croutons",
        sort_order: 1,
        modifier_option_group_id: null,
        modifier_option_groups: null,
      },
      {
        id: "chicken",
        name: "Chicken",
        sort_order: 1,
        modifier_option_group_id: "proteins",
        modifier_option_groups: {
          id: "proteins",
          name: "Proteins",
          description: null,
          is_enabled: true,
          sort_order: 1,
        },
      },
    ])

    expect(grouped).toEqual([
      {
        optionGroup: {
          id: "proteins",
          name: "Proteins",
          description: null,
          is_enabled: true,
          sort_order: 1,
        },
        options: [
          expect.objectContaining({
            id: "chicken",
          }),
        ],
      },
      {
        optionGroup: {
          id: "dressings",
          name: "Dressings",
          description: null,
          is_enabled: true,
          sort_order: 2,
        },
        options: [
          expect.objectContaining({
            id: "ranch",
          }),
        ],
      },
      {
        optionGroup: null,
        options: [
          expect.objectContaining({
            id: "croutons",
          }),
        ],
      },
    ])
  })

  it("treats disabled option groups as ungrouped", () => {
    const grouped = groupModifierOptionsByOptionGroup([
      {
        id: "pepperoni",
        name: "Pepperoni",
        sort_order: 1,
        modifier_option_group_id: "meats",
        modifier_option_groups: {
          id: "meats",
          name: "Meats",
          description: null,
          is_enabled: false,
          sort_order: 1,
        },
      },
    ])

    expect(grouped).toHaveLength(1)
    expect(grouped[0].optionGroup).toBeNull()
    expect(grouped[0].options[0].id).toBe("pepperoni")
  })
})
