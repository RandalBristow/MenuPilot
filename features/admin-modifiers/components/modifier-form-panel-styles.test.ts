import { describe, expect, it } from "vitest"
import {
  MODIFIER_FORM_BODY_CLASS,
  MODIFIER_FORM_CLASS,
  MODIFIER_FORM_FOOTER_CLASS,
  MODIFIER_FORM_SHEET_CONTENT_CLASS,
} from "./modifier-form-panel-styles"

describe("modifier form panel styles", () => {
  it("uses full-height bottom sheet constraints for mobile admin forms", () => {
    expect(MODIFIER_FORM_SHEET_CONTENT_CLASS).toContain(
      "data-[side=bottom]:top-2"
    )
    expect(MODIFIER_FORM_SHEET_CONTENT_CLASS).toContain(
      "data-[side=bottom]:bottom-2"
    )
    expect(MODIFIER_FORM_SHEET_CONTENT_CLASS).toContain(
      "data-[side=bottom]:h-auto"
    )
    expect(MODIFIER_FORM_SHEET_CONTENT_CLASS).toContain(
      "data-[side=bottom]:max-h-none"
    )
    expect(MODIFIER_FORM_SHEET_CONTENT_CLASS).toContain("overflow-hidden")
  })

  it("keeps header/footer fixed while the form body scrolls", () => {
    expect(MODIFIER_FORM_CLASS).toContain("flex-1")
    expect(MODIFIER_FORM_CLASS).toContain("flex-col")
    expect(MODIFIER_FORM_BODY_CLASS).toContain("overflow-y-auto")
    expect(MODIFIER_FORM_BODY_CLASS).toContain("no-scrollbar")
    expect(MODIFIER_FORM_FOOTER_CLASS).toContain("shrink-0")
    expect(MODIFIER_FORM_FOOTER_CLASS).toContain("justify-end")
  })
})
