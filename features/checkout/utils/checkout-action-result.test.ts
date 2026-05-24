import { describe, expect, it } from "vitest"
import { buildCheckoutValidationFailure } from "./checkout-action-result"

describe("checkout action result helpers", () => {
  it("returns a typed failure result for expected validation errors", () => {
    expect(
      buildCheckoutValidationFailure([
        {
          message:
            "Thin is no longer available for this item. Please update your cart.",
        },
      ])
    ).toEqual({
      ok: false,
      error:
        "Thin is no longer available for this item. Please update your cart.",
    })
  })

  it("summarizes multiple validation errors without throwing", () => {
    expect(
      buildCheckoutValidationFailure([
        { message: "First issue." },
        { message: "Second issue." },
        { message: "Third issue." },
        { message: "Fourth issue." },
      ])
    ).toEqual({
      ok: false,
      error: "First issue. Second issue. Third issue. 1 more cart item issue must be fixed.",
    })
  })
})
