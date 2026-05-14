import { describe, expect, it } from "vitest"
import { getProductDeleteStrategy } from "./get-product-delete-strategy"

describe("getProductDeleteStrategy", () => {
  it("prevents permanent delete when a product has order usage", () => {
    expect(getProductDeleteStrategy(true)).toBe("disable")
  })

  it("allows permanent delete when a product has no order usage", () => {
    expect(getProductDeleteStrategy(false)).toBe("delete")
  })

  it("keeps disable available when permanent delete is blocked", () => {
    const strategy = getProductDeleteStrategy(true)

    expect(strategy).toBe("disable")
  })
})
