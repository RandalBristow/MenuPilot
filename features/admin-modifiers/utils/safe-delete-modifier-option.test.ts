import { describe, expect, it } from "vitest"
import {
  getModifierOptionBlockedDeleteMessage,
  safeDeleteModifierOption,
  type ModifierOptionReferenceCheck,
} from "./safe-delete-modifier-option"

function createReferenceChecker(referencedKeys: string[]) {
  return async (check: ModifierOptionReferenceCheck) =>
    referencedKeys.includes(check.key)
}

describe("safeDeleteModifierOption", () => {
  it("deletes an unused modifier option", async () => {
    let deleted = false

    const result = await safeDeleteModifierOption({
      hasReference: createReferenceChecker([]),
      deleteReferences: async () => undefined,
      deleteOption: async () => {
        deleted = true
      },
    })

    expect(result.status).toBe("deleted")
    expect(deleted).toBe(true)
  })

  it.each([
    "product_default_modifier_options",
    "product_modifier_option_overrides",
    "product_variant_modifier_option_availability_rules",
    "product_variant_modifier_option_price_overrides",
  ])("cleans up config references before deleting when used by %s", async (referencedKey) => {
    let deleted = false
    let cleanedReferenceKeys: string[] = []

    const result = await safeDeleteModifierOption({
      hasReference: createReferenceChecker([referencedKey]),
      deleteReferences: async (checks) => {
        cleanedReferenceKeys = checks.map((check) => check.key)
      },
      deleteOption: async () => {
        deleted = true
      },
    })

    expect(result.status).toBe("deleted")
    expect(deleted).toBe(true)
    expect(cleanedReferenceKeys).toContain(referencedKey)
  })

  it.each([
    "order_item_modifiers",
  ])("blocks delete when used by %s", async (referencedKey) => {
    let deleted = false
    let cleaned = false

    const result = await safeDeleteModifierOption({
      hasReference: createReferenceChecker([referencedKey]),
      deleteReferences: async () => {
        cleaned = true
      },
      deleteOption: async () => {
        deleted = true
      },
    })

    expect(result.status).toBe("blocked")
    expect(deleted).toBe(false)
    expect(cleaned).toBe(false)
  })

  it("returns a friendly message when blocked", async () => {
    const result = await safeDeleteModifierOption({
      hasReference: createReferenceChecker(["order_item_modifiers"]),
      deleteReferences: async () => undefined,
      deleteOption: async () => undefined,
    })

    expect(result.message).toBe(
      "This modifier option cannot be deleted because it is in use by order history."
    )
  })

  it("does not remove the option when blocked by order history", async () => {
    let deleteCount = 0

    await safeDeleteModifierOption({
      hasReference: createReferenceChecker([
        "order_item_modifiers",
      ]),
      deleteReferences: async () => undefined,
      deleteOption: async () => {
        deleteCount += 1
      },
    })

    expect(deleteCount).toBe(0)
  })

  it("builds a generic friendly blocked message when no labels are available", () => {
    expect(getModifierOptionBlockedDeleteMessage([])).toBe(
      "This modifier option cannot be deleted because it is in use."
    )
  })
})
