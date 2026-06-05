import { describe, expect, it, vi } from "vitest"
import { getProductConfig } from "./get-product-config"

const supabaseMock = vi.hoisted(() => {
  type Row = Record<string, unknown>
  type Filter = {
    column: string
    value: unknown
  }

  const rowsByTable: Record<string, Row[]> = {
    businesses: [
      {
        id: "business-a",
        slug: "business-a",
      },
    ],
    products: [
      {
        id: "product-a",
        business_id: "business-a",
        name: "Business A Pizza",
        description: null,
        builder_template: "pizza",
        has_variants: false,
        is_enabled: true,
        base_price: 12,
        product_variant_groups: [],
        product_variant_option_overrides: [],
        product_variant_modifier_option_availability_rules: [],
        product_variant_modifier_option_price_overrides: [],
        product_modifier_option_overrides: [],
        product_modifier_groups: [],
        product_included_modifier_groups: [],
        product_default_modifier_options: [],
      },
      {
        id: "product-b",
        business_id: "business-b",
        name: "Business B Pizza",
        description: null,
        builder_template: "pizza",
        has_variants: false,
        is_enabled: true,
        base_price: 14,
        product_variant_groups: [],
        product_variant_option_overrides: [],
        product_variant_modifier_option_availability_rules: [],
        product_variant_modifier_option_price_overrides: [],
        product_modifier_option_overrides: [],
        product_modifier_groups: [],
        product_included_modifier_groups: [],
        product_default_modifier_options: [],
      },
    ],
  }

  function filterRows(table: string, filters: Filter[]) {
    return (rowsByTable[table] ?? []).filter((row) =>
      filters.every((filter) => row[filter.column] === filter.value)
    )
  }

  class FakeQueryBuilder {
    private filters: Filter[] = []

    constructor(private table: string) {}

    select() {
      return this
    }

    eq(column: string, value: unknown) {
      this.filters.push({ column, value })
      return this
    }

    single() {
      const row = filterRows(this.table, this.filters)[0] ?? null

      return Promise.resolve({
        data: row,
        error: row ? null : { message: "not found" },
      })
    }
  }

  return {
    from: (table: string) => new FakeQueryBuilder(table),
  }
})

vi.mock("@/lib/supabase/client", () => ({
  supabase: supabaseMock,
}))

describe("getProductConfig tenant scoping", () => {
  it("loads a product inside the supplied business slug", async () => {
    const product = await getProductConfig("product-a", {
      businessSlug: "business-a",
    })

    expect(product).toMatchObject({
      id: "product-a",
      business_id: "business-a",
      name: "Business A Pizza",
    })
  })

  it("rejects a product from another business when scoped by business slug", async () => {
    await expect(
      getProductConfig("product-b", { businessSlug: "business-a" })
    ).rejects.toThrow("Failed to load product config")
  })
})
