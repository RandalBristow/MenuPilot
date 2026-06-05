import { describe, expect, it } from "vitest"
import { getMediaAdminHref } from "@/features/admin-media/utils/media-admin-routes"

describe("media admin route helpers", () => {
  it("builds the legacy media admin URL without a business slug", () => {
    expect(getMediaAdminHref()).toBe("/admin/media")
  })

  it("builds the business-scoped media admin URL with a business slug", () => {
    expect(getMediaAdminHref("randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/media"
    )
  })
})
