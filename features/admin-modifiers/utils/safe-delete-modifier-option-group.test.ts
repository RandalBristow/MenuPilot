import { describe, expect, it } from "vitest"
import { safeDeleteModifierOptionGroup } from "./safe-delete-modifier-option-group"

describe("safeDeleteModifierOptionGroup", () => {
  it("deletes an empty modifier option list", async () => {
    let deleted = false

    const result = await safeDeleteModifierOptionGroup({
      getOptionCount: async () => 0,
      deleteOptions: async () => undefined,
      deleteOptionGroup: async () => {
        deleted = true
      },
    })

    expect(result.status).toBe("deleted")
    expect(deleted).toBe(true)
  })

  it("deletes modifier options before deleting a non-empty list", async () => {
    let deletedOptions = false
    let deleted = false

    const result = await safeDeleteModifierOptionGroup({
      getOptionCount: async () => 3,
      deleteOptions: async () => {
        deletedOptions = true
      },
      deleteOptionGroup: async () => {
        deleted = true
      },
    })

    expect(result.status).toBe("deleted")
    expect(result.message).toBe(
      "Modifier option list deleted. 3 options were also deleted."
    )
    expect(deletedOptions).toBe(true)
    expect(deleted).toBe(true)
  })

  it("uses singular copy when one option is deleted", async () => {
    const result = await safeDeleteModifierOptionGroup({
      getOptionCount: async () => 1,
      deleteOptions: async () => undefined,
      deleteOptionGroup: async () => undefined,
    })

    expect(result.message).toBe(
      "Modifier option list deleted. 1 option was also deleted."
    )
  })
})
