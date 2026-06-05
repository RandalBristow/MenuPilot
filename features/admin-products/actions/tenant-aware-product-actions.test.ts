import { beforeEach, describe, expect, it, vi } from "vitest"
import { createProduct } from "./create-product"
import { deleteProduct } from "./delete-product"
import { duplicateProduct } from "./duplicate-product"
import { setProductEnabled } from "./set-product-enabled"
import { updateProduct } from "./update-product"

const actionMocks = vi.hoisted(() => {
  type Row = Record<string, unknown>
  type Filter = {
    column: string
    value: unknown
    values?: unknown[]
    mode: "eq" | "in"
  }

  const state = {
    revalidated: [] as string[],
    redirected: [] as string[],
    inserts: [] as Array<{ table: string; records: Row[] }>,
    updates: [] as Array<{ table: string; payload: Row; filters: Filter[] }>,
    deletes: [] as Array<{ table: string; filters: Filter[] }>,
    nextProductId: "new-product",
    rowsByTable: {} as Record<string, Row[]>,
  }

  function reset() {
    state.revalidated = []
    state.redirected = []
    state.inserts = []
    state.updates = []
    state.deletes = []
    state.nextProductId = "new-product"
    state.rowsByTable = {
      businesses: [
        { id: "business-demo", slug: "pronto-demo" },
        { id: "business-a", slug: "randys-pizza" },
        { id: "business-b", slug: "other-business" },
      ],
      menu_groups: [
        { id: "menu-demo", business_id: "business-demo" },
        { id: "menu-a", business_id: "business-a" },
        { id: "menu-b", business_id: "business-b" },
      ],
      media_assets: [
        { id: "media-a", business_id: "business-a", is_archived: false },
        { id: "media-b", business_id: "business-b", is_archived: false },
      ],
      modifier_groups: [],
      products: [
        {
          id: "product-a",
          business_id: "business-a",
          name: "Business A Pizza",
          description: "A pizza",
          base_price: 12,
          sku: "A",
          image_media_id: "media-a",
          builder_template: "pizza",
          has_variants: true,
          prep_time_minutes: 15,
          prep_time_type: "fixed",
          is_taxable: true,
          is_featured: false,
        },
        {
          id: "product-b",
          business_id: "business-b",
          name: "Business B Pizza",
          description: "B pizza",
          base_price: 14,
          sku: "B",
          image_media_id: "media-b",
          builder_template: "pizza",
          has_variants: true,
          prep_time_minutes: 15,
          prep_time_type: "fixed",
          is_taxable: true,
          is_featured: false,
        },
      ],
      product_groups: [
        {
          business_id: "business-a",
          product_id: "product-a",
          menu_group_id: "menu-a",
          is_primary: true,
          sort_order: 1,
        },
      ],
      product_variant_groups: [
        {
          business_id: "business-a",
          product_id: "product-a",
          variant_group_id: "variant-group-a",
          is_enabled: true,
          sort_order: 1,
        },
      ],
      product_variant_option_overrides: [],
      product_modifier_groups: [
        {
          business_id: "business-a",
          product_id: "product-a",
          modifier_group_id: "modifier-group-a",
          is_enabled: true,
          sort_order: 1,
        },
      ],
      product_modifier_option_overrides: [],
      product_default_modifier_options: [],
      product_included_modifier_groups: [],
      product_variant_modifier_option_availability_rules: [],
      product_variant_modifier_option_price_overrides: [],
      order_items: [],
      variant_groups: [],
      modifier_options: [],
      modifier_option_groups: [],
    }
  }

  function matches(row: Row, filters: Filter[]) {
    return filters.every((filter) => {
      if (filter.mode === "in") {
        return filter.values?.includes(row[filter.column])
      }

      return row[filter.column] === filter.value
    })
  }

  class FakeQueryBuilder {
    private filters: Filter[] = []
    private operation:
      | { type: "insert"; records: Row[] }
      | { type: "update"; payload: Row }
      | { type: "delete" }
      | null = null
    private selected = false

    constructor(private table: string) {}

    select() {
      this.selected = true
      return this
    }

    eq(column: string, value: unknown) {
      this.filters.push({ column, value, mode: "eq" })
      return this
    }

    in(column: string, values: unknown[]) {
      this.filters.push({ column, value: null, values, mode: "in" })
      return this
    }

    order() {
      return this
    }

    limit() {
      return this
    }

    insert(payload: Row | Row[]) {
      const records = Array.isArray(payload) ? payload : [payload]
      this.operation = { type: "insert", records }
      return this
    }

    update(payload: Row) {
      this.operation = { type: "update", payload }
      return this
    }

    delete() {
      this.operation = { type: "delete" }
      return this
    }

    single() {
      if (this.operation?.type === "insert" && this.table === "products") {
        const record = {
          ...this.operation.records[0],
          id: state.nextProductId,
        }
        state.inserts.push({ table: this.table, records: [record] })
        state.rowsByTable.products.push(record)

        return Promise.resolve({ data: { id: record.id }, error: null })
      }

      const row =
        (state.rowsByTable[this.table] ?? []).find((item) =>
          matches(item, this.filters)
        ) ?? null

      return Promise.resolve({
        data: row,
        error: row ? null : { message: "not found" },
      })
    }

    maybeSingle() {
      const row =
        (state.rowsByTable[this.table] ?? []).find((item) =>
          matches(item, this.filters)
        ) ?? null

      return Promise.resolve({ data: row, error: null })
    }

    then<TResult1 = { data: Row[] | null; error: null }>(
      onfulfilled?: (value: { data: Row[] | null; error: null }) => TResult1
    ) {
      const result = this.resolve()

      return Promise.resolve(result).then(onfulfilled)
    }

    private resolve() {
      if (this.operation?.type === "insert") {
        state.inserts.push({
          table: this.table,
          records: this.operation.records,
        })
        state.rowsByTable[this.table]?.push(...this.operation.records)

        return { data: this.selected ? this.operation.records : null, error: null }
      }

      if (this.operation?.type === "update") {
        state.updates.push({
          table: this.table,
          payload: this.operation.payload,
          filters: this.filters,
        })

        return { data: null, error: null }
      }

      if (this.operation?.type === "delete") {
        state.deletes.push({ table: this.table, filters: this.filters })

        return { data: null, error: null }
      }

      return {
        data: (state.rowsByTable[this.table] ?? []).filter((row) =>
          matches(row, this.filters)
        ),
        error: null,
      }
    }
  }

  return {
    reset,
    state,
    supabaseAdmin: {
      from: (table: string) => new FakeQueryBuilder(table),
    },
    revalidatePath: (path: string) => state.revalidated.push(path),
    redirect: (path: string) => {
      state.redirected.push(path)
      throw new Error(`NEXT_REDIRECT:${path}`)
    },
  }
})

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: actionMocks.supabaseAdmin,
}))

vi.mock("next/cache", () => ({
  revalidatePath: actionMocks.revalidatePath,
}))

vi.mock("next/navigation", () => ({
  redirect: actionMocks.redirect,
}))

function createProductFormData({
  businessSlug,
  productId,
  menuGroupId = "menu-a",
  imageMediaId = "",
}: {
  businessSlug?: string
  productId?: string
  menuGroupId?: string
  imageMediaId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  if (productId) formData.set("productId", productId)
  formData.set("name", "New Pizza")
  formData.set("description", "A new pizza")
  formData.set("basePrice", "12.99")
  formData.set("builderTemplate", "pizza")
  formData.set("hasVariants", "true")
  formData.set("menuGroupId", menuGroupId)
  formData.set("imageMediaId", imageMediaId)
  formData.set("isEnabled", "true")

  return formData
}

function createProductIdFormData({
  businessSlug = "randys-pizza",
  productId = "product-a",
  isEnabled = "false",
}: {
  businessSlug?: string
  productId?: string
  isEnabled?: string
} = {}) {
  const formData = new FormData()
  formData.set("businessSlug", businessSlug)
  formData.set("productId", productId)
  formData.set("isEnabled", isEnabled)

  return formData
}

function createDuplicateFormData({
  businessSlug = "randys-pizza",
  productId = "product-a",
}: {
  businessSlug?: string
  productId?: string
} = {}) {
  const formData = new FormData()
  formData.set("businessSlug", businessSlug)
  formData.set("productId", productId)
  formData.set("newName", "Copy of Business A Pizza")
  formData.set("copyImage", "true")

  return formData
}

describe("tenant-aware core product actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("createProduct writes the selected business_id when businessSlug is provided", async () => {
    await expect(
      createProduct(
        createProductFormData({
          businessSlug: "randys-pizza",
          imageMediaId: "media-a",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "products",
      records: [{ business_id: "business-a" }],
    })
    expect(actionMocks.state.redirected).toEqual([
      "/businesses/randys-pizza/admin/products/list",
    ])
    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/list"
    )
  })

  it("createProduct keeps legacy demo fallback when businessSlug is omitted", async () => {
    await expect(
      createProduct(createProductFormData({ menuGroupId: "menu-demo" }))
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "products",
      records: [{ business_id: "business-demo" }],
    })
    expect(actionMocks.state.redirected).toEqual(["/admin/products"])
  })

  it("updateProduct refuses a product from another business", async () => {
    await expect(
      updateProduct(
        createProductFormData({
          businessSlug: "randys-pizza",
          productId: "product-b",
        })
      )
    ).rejects.toThrow("Product could not be found.")

    expect(actionMocks.state.updates).toEqual([])
  })

  it("deleteProduct refuses a product from another business", async () => {
    await expect(
      deleteProduct(
        createProductIdFormData({
          businessSlug: "randys-pizza",
          productId: "product-b",
        })
      )
    ).rejects.toThrow("Product could not be found.")

    expect(actionMocks.state.deletes).toEqual([])
  })

  it("setProductEnabled refuses a product from another business", async () => {
    await expect(
      setProductEnabled(
        createProductIdFormData({
          businessSlug: "randys-pizza",
          productId: "product-b",
        })
      )
    ).rejects.toThrow("Product could not be found.")

    expect(actionMocks.state.updates).toEqual([])
  })

  it("duplicateProduct refuses a source product from another business", async () => {
    const result = await duplicateProduct(
      createDuplicateFormData({
        businessSlug: "randys-pizza",
        productId: "product-b",
      })
    )

    expect(result).toEqual({
      status: "error",
      message: "Product could not be found.",
    })
    expect(actionMocks.state.inserts).toEqual([])
  })

  it("duplicateProduct creates the copied product under the selected business", async () => {
    const result = await duplicateProduct(createDuplicateFormData())

    expect(result).toMatchObject({
      status: "duplicated",
      productId: "new-product",
    })
    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "products",
      records: [{ business_id: "business-a" }],
    })
  })

  it("duplicateProduct copied relationships use the new product_id", async () => {
    await duplicateProduct(createDuplicateFormData())

    const productGroupInsert = actionMocks.state.inserts.find(
      (insert) => insert.table === "product_groups"
    )
    const variantAssignmentInsert = actionMocks.state.inserts.find(
      (insert) => insert.table === "product_variant_groups"
    )

    expect(productGroupInsert?.records[0]).toMatchObject({
      business_id: "business-a",
      product_id: "new-product",
      menu_group_id: "menu-a",
    })
    expect(variantAssignmentInsert?.records[0]).toMatchObject({
      business_id: "business-a",
      product_id: "new-product",
      variant_group_id: "variant-group-a",
    })
  })

  it("duplicateProduct does not duplicate reusable global records", async () => {
    await duplicateProduct(createDuplicateFormData())

    expect(
      actionMocks.state.inserts.some((insert) => insert.table === "variant_groups")
    ).toBe(false)
    expect(
      actionMocks.state.inserts.some((insert) => insert.table === "modifier_groups")
    ).toBe(false)
    expect(
      actionMocks.state.inserts.some((insert) => insert.table === "media_assets")
    ).toBe(false)
  })

  it("duplicateProduct scoped revalidations include businessSlug", async () => {
    await duplicateProduct(createDuplicateFormData())

    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/list"
    )
    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/new-product"
    )
  })
})
