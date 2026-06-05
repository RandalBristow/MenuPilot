import { describe, expect, it } from "vitest"
import {
  getModifierAdminHref,
  getModifierGroupHref,
  getModifierOptionGroupHref,
} from "@/features/admin-modifiers/utils/modifier-admin-routes"

describe("modifier admin route helpers", () => {
  it("builds legacy modifier admin URLs without a business slug", () => {
    expect(getModifierAdminHref()).toBe("/admin/modifiers")
    expect(getModifierAdminHref("categories")).toBe(
      "/admin/modifiers/categories"
    )
    expect(getModifierGroupHref({ groupId: "group-1" })).toBe(
      "/admin/modifiers/group-1"
    )
  })

  it("builds business-scoped modifier admin URLs when a slug is supplied", () => {
    expect(getModifierAdminHref("", "randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/modifiers"
    )
    expect(getModifierAdminHref("groups", "randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/modifiers/groups"
    )
    expect(
      getModifierGroupHref({
        groupId: "group-1",
        businessSlug: "randys-pizza",
      })
    ).toBe("/businesses/randys-pizza/admin/modifiers/group-1")
  })

  it("preserves product query context for scoped detail URLs", () => {
    expect(
      getModifierOptionGroupHref({
        groupId: "group-1",
        optionGroupId: "list-1",
        productId: "product-1",
        businessSlug: "randys-pizza",
      })
    ).toBe(
      "/businesses/randys-pizza/admin/modifiers/group-1/subgroups/list-1?productId=product-1"
    )
  })
})
