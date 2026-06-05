import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getAdminProductsPageData } from "@/features/admin-products/components/AdminProductsPage"
import { getProductFormData } from "@/features/admin-products/components/ProductForm"
import { AdminProductsBrowser } from "@/features/admin-products/components/AdminProductsBrowser"
import { ProductManagementHub } from "@/features/admin-products/components/ProductManagementHub"
import { getVariantGroupDetail } from "./get-variant-groups"
import type { TenantBusinessContext } from "@/features/tenant/types/tenant-context"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  notFound: vi.fn(),
}))

const supabaseMock = vi.hoisted(() => {
  type HoistedRow = Record<string, unknown>
  type HoistedFilter = {
    column: string
    value: unknown
  }

  const rowsByTable: Record<string, HoistedRow[]> = {
    menu_groups: [
      {
        id: "group-a",
        business_id: "business-a",
        name: "Pizza",
        slug: "pizza",
        description: null,
        parent_group_id: null,
        sort_order: 1,
        product_groups: [
          {
            id: "product-group-a",
            sort_order: 1,
            products: {
              id: "product-a",
              name: "Business A Pizza",
              slug: "business-a-pizza",
              description: null,
              base_price: 12,
              builder_template: "pizza",
              has_variants: true,
              is_enabled: true,
            },
          },
        ],
      },
      {
        id: "group-b",
        business_id: "business-b",
        name: "Pizza",
        slug: "pizza",
        description: null,
        parent_group_id: null,
        sort_order: 1,
        product_groups: [
          {
            id: "product-group-b",
            sort_order: 1,
            products: {
              id: "product-b",
              name: "Business B Pizza",
              slug: "business-b-pizza",
              description: null,
              base_price: 14,
              builder_template: "pizza",
              has_variants: true,
              is_enabled: true,
            },
          },
        ],
      },
    ],
    products: [
      {
        id: "product-b",
        business_id: "business-b",
        name: "Business B Pizza",
        description: null,
        base_price: 14,
        builder_template: "pizza",
        has_variants: true,
        is_enabled: true,
        image_media_id: null,
        media_assets: null,
        product_groups: [{ menu_group_id: "group-b", is_primary: true }],
        product_modifier_groups: [],
      },
    ],
    media_assets: [],
    modifier_groups: [],
    variant_groups: [
      {
        id: "variant-b",
        business_id: "business-b",
        name: "Business B Sizes",
        description: null,
        is_enabled: true,
        sort_order: 1,
        variant_group_options: [],
      },
    ],
  }

  function filterRows(table: string, filters: HoistedFilter[]) {
    return (rowsByTable[table] ?? []).filter((row) =>
      filters.every((filter) => row[filter.column] === filter.value)
    )
  }

  class FakeQueryBuilder {
    private filters: HoistedFilter[] = []

    constructor(private table: string) {}

    select() {
      return this
    }

    eq(column: string, value: unknown) {
      this.filters.push({ column, value })
      return this
    }

    is(column: string, value: unknown) {
      this.filters.push({ column, value })
      return this
    }

    order() {
      return Promise.resolve({
        data: filterRows(this.table, this.filters),
        error: null,
      })
    }

    single() {
      const row = filterRows(this.table, this.filters)[0] ?? null

      return Promise.resolve({
        data: row,
        error: row ? null : { message: "not found" },
      })
    }

    maybeSingle() {
      const row = filterRows(this.table, this.filters)[0] ?? null

      return Promise.resolve({
        data: row,
        error: null,
      })
    }
  }

  return {
    from: (table: string) => new FakeQueryBuilder(table),
  }
})

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: supabaseMock,
}))

const businessA: TenantBusinessContext = {
  id: "business-a",
  slug: "business-a",
  name: "Business A",
  status: "active",
  primaryContactName: null,
  primaryContactEmail: null,
  primaryPhone: null,
  isActive: true,
  isSetup: false,
  isPaused: false,
  isArchived: false,
}

describe("tenant-scoped product admin reads", () => {
  it("uses the supplied business context for the product list", async () => {
    const result = await getAdminProductsPageData({ business: businessA })

    expect(result.businessName).toBe("Business A")
    expect(result.menuGroups).toHaveLength(1)
    expect(result.menuGroups[0]?.product_groups[0]?.product?.name).toBe(
      "Business A Pizza"
    )
    expect(JSON.stringify(result.menuGroups)).not.toContain("Business B Pizza")
  })

  it("rejects product detail data for a product from another business", async () => {
    await expect(
      getProductFormData("product-b", { business: businessA })
    ).rejects.toThrow("Could not load product.")
  })

  it("returns null for a variant group from another business", async () => {
    await expect(
      getVariantGroupDetail("variant-b", undefined, { business: businessA })
    ).resolves.toBeNull()
  })

  it("renders scoped product links and disables tenant-scoped write controls", () => {
    const { unmount } = render(<ProductManagementHub businessSlug="business-a" />)

    expect(screen.getByLabelText("Open Products").getAttribute("href")).toBe(
      "/businesses/business-a/admin/products/list"
    )
    unmount()

    render(
      <AdminProductsBrowser
        businessSlug="business-a"
        writesEnabled={false}
        menuGroups={[
          {
            id: "group-a",
            name: "Pizza",
            slug: "pizza",
            description: null,
            parent_group_id: null,
            sort_order: 1,
            product_groups: [
              {
                id: "product-group-a",
                sort_order: 1,
                product: {
                  id: "product-a",
                  name: "Business A Pizza",
                  slug: "business-a-pizza",
                  description: null,
                  base_price: 12,
                  builder_template: "pizza",
                  has_variants: true,
                  is_enabled: true,
                },
              },
            ],
          },
        ]}
      />
    )

    expect(
      screen.getByLabelText<HTMLButtonElement>(
        "New product unavailable until scoped product writes are converted"
      ).disabled
    ).toBe(true)
    expect(
      screen.getByLabelText<HTMLButtonElement>(
        "Duplicate product Business A Pizza"
      ).disabled
    ).toBe(true)
  })
})
