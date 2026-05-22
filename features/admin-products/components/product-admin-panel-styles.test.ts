import { describe, expect, it } from "vitest"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_PANEL_PAGE_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "./product-admin-panel-styles"

describe("product admin panel styles", () => {
  it("keeps product add/edit and view panels on the same sheet shell", () => {
    const sheetPanelClasses = [
      "inset-x-0",
      "data-[side=bottom]:top-2",
      "data-[side=bottom]:bottom-2",
      "gap-0",
      "overflow-hidden",
      "rounded-lg",
      "border",
      "text-sm",
      "sm:left-1/2",
      "sm:w-full",
      "sm:max-w-2xl",
      "sm:-translate-x-1/2",
    ]

    for (const className of sheetPanelClasses) {
      expect(PRODUCT_ADMIN_SHEET_PANEL_CLASS).toContain(className)
    }
  })

  it("keeps the same form panel sections for add, edit, and view", () => {
    expect(PRODUCT_ADMIN_PANEL_PAGE_CLASS).toContain("bg-muted/40")
    expect(PRODUCT_ADMIN_PANEL_HEADER_CLASS).toContain("border-b")
    expect(PRODUCT_ADMIN_PANEL_HEADER_CLASS).toContain("p-4")
    expect(PRODUCT_ADMIN_PANEL_BODY_CLASS).toContain("overflow-y-auto")
    expect(PRODUCT_ADMIN_PANEL_FOOTER_CLASS).toContain("justify-end")
  })
})
