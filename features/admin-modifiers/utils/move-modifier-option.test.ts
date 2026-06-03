import { describe, expect, it } from "vitest"
import {
  moveModifierOption,
  type MoveModifierOptionStore,
} from "./move-modifier-option"

function createStore({
  optionGroupId = "cheeses",
  destinationGroupId = "salad-toppings",
}: {
  optionGroupId?: string | null
  destinationGroupId?: string | null
} = {}) {
  const updates: Array<{
    optionId: string
    modifierGroupId: string
    destinationOptionGroupId: string | null
  }> = []
  const store: MoveModifierOptionStore = {
    async findOption() {
      return {
        id: "tomato",
        modifier_group_id: "salad-toppings",
        modifier_option_group_id: optionGroupId,
      }
    },
    async findDestinationOptionGroup({ destinationOptionGroupId }) {
      if (!destinationGroupId) return null

      return {
        id: destinationOptionGroupId,
        modifier_group_id: destinationGroupId,
      }
    },
    async updateOptionGroup(input) {
      updates.push(input)
    },
  }

  return { store, updates }
}

describe("moveModifierOption", () => {
  it("moves option to another option group in the same modifier group", async () => {
    const { store, updates } = createStore()

    const result = await moveModifierOption({
      payload: {
        optionId: "tomato",
        modifierGroupId: "salad-toppings",
        destinationOptionGroupId: "veggies",
      },
      store,
    })

    expect(result.status).toBe("moved")
    expect(updates).toEqual([
      {
        optionId: "tomato",
        modifierGroupId: "salad-toppings",
        destinationOptionGroupId: "veggies",
      },
    ])
  })

  it("blocks moving option outside the same modifier group", async () => {
    const { store, updates } = createStore({ destinationGroupId: null })

    const result = await moveModifierOption({
      payload: {
        optionId: "tomato",
        modifierGroupId: "salad-toppings",
        destinationOptionGroupId: "pizza-cheeses",
      },
      store,
    })

    expect(result.status).toBe("blocked")
    expect(result.message).toBe(
      "Modifier options can only be moved to option groups inside the same Modifier Group."
    )
    expect(updates).toEqual([])
  })

  it("preserves modifier_option_id", async () => {
    const { store } = createStore()

    const result = await moveModifierOption({
      payload: {
        optionId: "tomato",
        modifierGroupId: "salad-toppings",
        destinationOptionGroupId: "veggies",
      },
      store,
    })

    expect(result).toMatchObject({
      status: "moved",
      optionId: "tomato",
    })
  })

  it("surfaces a friendly error when blocked", async () => {
    const store: MoveModifierOptionStore = {
      async findOption() {
        return null
      },
      async findDestinationOptionGroup() {
        return null
      },
      async updateOptionGroup() {
        throw new Error("should not update")
      },
    }

    const result = await moveModifierOption({
      payload: {
        optionId: "missing",
        modifierGroupId: "salad-toppings",
        destinationOptionGroupId: "veggies",
      },
      store,
    })

    expect(result).toEqual({
      status: "blocked",
      message: "Selected modifier option could not be found.",
    })
  })
})

