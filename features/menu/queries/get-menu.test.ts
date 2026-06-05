import { describe, expect, it, vi } from "vitest"
import { applyMenuBusinessScope, isSetupBusiness } from "./get-menu"

vi.mock("@/lib/supabase/client", () => ({
  supabase: {},
}))

const businessAProduct = {
  id: "product-a",
  business_id: "business-a",
  name: "Business A Pizza",
  slug: "business-a-pizza",
  description: null,
  base_price: 12,
  builder_template: "pizza",
  has_variants: true,
  is_featured: false,
  is_enabled: true,
  media_assets: {
    id: "media-a",
    business_id: "business-a",
    public_url: "https://example.com/a.jpg",
    alt_text: null,
    caption: null,
    is_archived: false,
  },
  product_variant_groups: [],
  product_variant_option_overrides: [],
}

const businessBProduct = {
  id: "product-b",
  business_id: "business-b",
  name: "Business B Pizza",
  slug: "business-b-pizza",
  description: null,
  base_price: 14,
  builder_template: "pizza",
  has_variants: true,
  is_featured: false,
  is_enabled: true,
  media_assets: null,
  product_variant_groups: [],
  product_variant_option_overrides: [],
}

describe("menu tenant scoping", () => {
  it("removes products from sibling businesses inside a scoped menu result", () => {
    const menu = {
      id: "menu-a",
      menu_groups: [
        {
          id: "group-a",
          product_groups: [
            {
              id: "product-group-a",
              products: businessAProduct,
            },
            {
              id: "product-group-b",
              products: businessBProduct,
            },
          ],
        },
      ],
    }

    const scopedMenu = applyMenuBusinessScope(menu, "business-a")
    const productGroups = scopedMenu.menu_groups[0]?.product_groups ?? []

    expect(productGroups).toHaveLength(1)
    expect(productGroups[0]?.products).toMatchObject({
      id: "product-a",
      name: "Business A Pizza",
    })
    expect(JSON.stringify(scopedMenu)).not.toContain("Business B Pizza")
  })

  it("removes media records that belong to another business", () => {
    const menu = {
      id: "menu-a",
      menu_groups: [
        {
          id: "group-a",
          product_groups: [
            {
              id: "product-group-a",
              products: {
                ...businessAProduct,
                media_assets: {
                  id: "media-b",
                  business_id: "business-b",
                  public_url: "https://example.com/b.jpg",
                  alt_text: null,
                  caption: null,
                  is_archived: false,
                },
              },
            },
          ],
        },
      ],
    }

    const scopedMenu = applyMenuBusinessScope(menu, "business-a")
    const productGroup = scopedMenu.menu_groups[0]?.product_groups[0]

    expect(productGroup?.products).toMatchObject({
      id: "product-a",
      media_assets: null,
    })
  })

  it("identifies setup businesses for public preview messaging", () => {
    expect(isSetupBusiness({ status: "setup" })).toBe(true)
    expect(isSetupBusiness({ status: "active" })).toBe(false)
  })
})
