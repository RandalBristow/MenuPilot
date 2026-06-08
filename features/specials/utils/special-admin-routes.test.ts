import { describe, expect, it } from "vitest"
import {
  getSpecialAdminBaseHref,
  getSpecialAdminHref,
  getSpecialDetailHref,
} from "@/features/specials/utils/special-admin-routes"

describe("special admin routes", () => {
  it("uses the business slug for tenant-scoped specials links", () => {
    expect(getSpecialAdminBaseHref("randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/specials"
    )
    expect(getSpecialAdminHref("new", "randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/specials/new"
    )
    expect(getSpecialDetailHref("special-a", "randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/specials/special-a"
    )
  })
})
