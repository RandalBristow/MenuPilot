import { describe, expect, it } from "vitest"
import { getIncludedSummary } from "./product-included-modifier-summary"

describe("getIncludedSummary", () => {
  it("shows included summary when configured", () => {
    expect(
      getIncludedSummary({
        included_quantity: 2,
        charge_for_extra: true,
      })
    ).toBe("Included: 2 selections - Extras: charged")
  })

  it("hides included summary when no rule is configured", () => {
    expect(getIncludedSummary(null)).toBeNull()
  })
})
