import { describe, expect, it } from "vitest"
import { getDefaultModifierIncludedSelectionWarnings } from "./default-modifier-included-selection-warnings"

const product = {
  id: "product-meat",
  name: "Meat Pizza",
}

const pizzaToppings = {
  id: "group-toppings",
  name: "Pizza Toppings",
}

const pizzaSauce = {
  id: "group-sauce",
  name: "Pizza Sauce",
}

function buildDefaults(count: number, groupId = pizzaToppings.id) {
  return Array.from({ length: count }, () => ({
    product_id: product.id,
    modifier_group_id: groupId,
    is_enabled: true,
  }))
}

function getWarnings({
  defaultCount,
  includedCount,
  groups = [pizzaToppings],
}: {
  defaultCount: number
  includedCount?: number
  groups?: typeof pizzaToppings[]
}) {
  return getDefaultModifierIncludedSelectionWarnings({
    product,
    assignedModifierGroups: groups,
    defaultModifierOptions: buildDefaults(defaultCount),
    includedModifierGroupRules:
      includedCount === undefined
        ? []
        : [
            {
              product_id: product.id,
              modifier_group_id: pizzaToppings.id,
              included_quantity: includedCount,
            },
          ],
  })
}

describe("getDefaultModifierIncludedSelectionWarnings", () => {
  it("does not warn when there are no defaults", () => {
    expect(getWarnings({ defaultCount: 0 })).toEqual([])
  })

  it("warns when defaults exist and included rule is missing", () => {
    const warnings = getWarnings({ defaultCount: 5 })

    expect(warnings).toMatchObject([
      {
        productId: "product-meat",
        modifierGroupId: "group-toppings",
        modifierGroupName: "Pizza Toppings",
        defaultCount: 5,
        includedCount: 0,
      },
    ])
  })

  it("warns when defaults exceed zero included selections", () => {
    expect(getWarnings({ defaultCount: 5, includedCount: 0 })).toHaveLength(1)
  })

  it("warns when defaults exceed included selections", () => {
    const warnings = getWarnings({ defaultCount: 5, includedCount: 3 })

    expect(warnings[0]).toMatchObject({
      defaultCount: 5,
      includedCount: 3,
    })
  })

  it("does not warn when defaults equal included selections", () => {
    expect(getWarnings({ defaultCount: 5, includedCount: 5 })).toEqual([])
  })

  it("does not warn when included selections exceed defaults", () => {
    expect(getWarnings({ defaultCount: 5, includedCount: 6 })).toEqual([])
  })

  it("produces separate warnings for multiple modifier groups", () => {
    const warnings = getDefaultModifierIncludedSelectionWarnings({
      product,
      assignedModifierGroups: [pizzaToppings, pizzaSauce],
      defaultModifierOptions: [
        ...buildDefaults(5, pizzaToppings.id),
        ...buildDefaults(1, pizzaSauce.id),
      ],
      includedModifierGroupRules: [
        {
          product_id: product.id,
          modifier_group_id: pizzaToppings.id,
          included_quantity: 3,
        },
        {
          product_id: product.id,
          modifier_group_id: pizzaSauce.id,
          included_quantity: 0,
        },
      ],
    })

    expect(warnings).toHaveLength(2)
    expect(warnings.map((warning) => warning.modifierGroupName)).toEqual([
      "Pizza Toppings",
      "Pizza Sauce",
    ])
  })

  it("includes modifier group name and counts in the warning message", () => {
    const warnings = getWarnings({ defaultCount: 5, includedCount: 3 })

    expect(warnings[0]?.message).toContain("Pizza Toppings")
    expect(warnings[0]?.message).toContain("5")
    expect(warnings[0]?.message).toContain("3")
  })
})
