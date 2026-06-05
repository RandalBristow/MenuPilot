import { describe, expect, it } from "vitest"
import {
  getProductAdminHref,
  getProductDetailHref,
  getProductListHref,
  getProductModifierAvailabilityHref,
  getProductModifierGroupsHref,
  getProductVariantAssignmentsHref,
  getVariantGroupDetailHref,
} from "./product-admin-routes"

describe("product admin route helpers", () => {
  it("builds legacy product admin URLs without a business slug", () => {
    expect(getProductAdminHref()).toBe("/admin/products")
    expect(getProductListHref()).toBe("/admin/products/list")
    expect(getProductDetailHref("product-1")).toBe("/admin/products/product-1")
  })

  it("builds business-scoped product admin URLs when a business slug is supplied", () => {
    expect(getProductAdminHref("", "randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/products"
    )
    expect(getProductListHref("randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/products/list"
    )
    expect(getProductDetailHref("product-1", "randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/products/product-1"
    )
  })

  it("builds scoped product sub-pages with query strings", () => {
    expect(getProductVariantAssignmentsHref("product-1", "randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/products/variant-assignments?productId=product-1"
    )
    expect(getProductModifierGroupsHref("product-1", "randys-pizza")).toBe(
      "/businesses/randys-pizza/admin/products/modifier-groups?productId=product-1"
    )
    expect(
      getProductModifierAvailabilityHref({
        modifierGroupId: "modifier-1",
        productId: "product-1",
        businessSlug: "randys-pizza",
      })
    ).toBe(
      "/businesses/randys-pizza/admin/products/modifier-groups/modifier-1/availability?productId=product-1"
    )
    expect(
      getVariantGroupDetailHref({
        groupId: "variant-1",
        productId: "product-1",
        businessSlug: "randys-pizza",
      })
    ).toBe(
      "/businesses/randys-pizza/admin/products/variant-groups/variant-1?productId=product-1"
    )
  })
})
