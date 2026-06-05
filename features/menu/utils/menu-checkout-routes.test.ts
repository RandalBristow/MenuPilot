import { describe, expect, it } from "vitest"
import { getMenuCheckoutHref } from "./menu-checkout-routes"

describe("menu checkout routes", () => {
  it("uses legacy checkout without a business slug", () => {
    expect(getMenuCheckoutHref()).toBe("/checkout")
  })

  it("uses business-scoped checkout with a business slug", () => {
    expect(getMenuCheckoutHref("randys-pizza")).toBe(
      "/businesses/randys-pizza/checkout"
    )
  })
})
