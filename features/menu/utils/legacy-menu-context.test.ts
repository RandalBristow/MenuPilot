import { describe, expect, it } from "vitest"
import { LEGACY_MENU_BUSINESS_SLUG } from "./legacy-menu-context"

describe("legacy menu context", () => {
  it("keeps /menu pointed at the Pronto demo business", () => {
    expect(LEGACY_MENU_BUSINESS_SLUG).toBe("pronto-demo")
  })
})
