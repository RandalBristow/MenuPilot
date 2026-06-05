import { beforeEach, describe, expect, it, vi } from "vitest"
import { saveProductCategory } from "./save-product-category"
import { saveProductSubcategory } from "./save-product-subcategory"

const actionMocks = vi.hoisted(() => {
  type Row = Record<string, unknown>
  type Filter = {
    column: string
    operator: "eq" | "is" | "not-is"
    value: unknown
  }

  const state = {
    revalidated: [] as string[],
    inserts: [] as Array<{ table: string; records: Row[] }>,
    updates: [] as Array<{ table: string; payload: Row; filters: Filter[] }>,
    rowsByTable: {} as Record<string, Row[]>,
  }

  function reset() {
    state.revalidated = []
    state.inserts = []
    state.updates = []
    state.rowsByTable = {
      businesses: [
        { id: "business-demo", slug: "pronto-demo" },
        { id: "business-a", slug: "randys-pizza" },
        { id: "business-b", slug: "other-business" },
      ],
      menus: [
        { id: "menu-demo", business_id: "business-demo", name: "Main Menu" },
        { id: "menu-a", business_id: "business-a", name: "Main Menu" },
        { id: "menu-b", business_id: "business-b", name: "Main Menu" },
      ],
      menu_groups: [
        {
          id: "category-demo",
          business_id: "business-demo",
          menu_id: "menu-demo",
          parent_group_id: null,
          name: "Demo Category",
        },
        {
          id: "category-a",
          business_id: "business-a",
          menu_id: "menu-a",
          parent_group_id: null,
          name: "Business A Category",
        },
        {
          id: "category-b",
          business_id: "business-b",
          menu_id: "menu-b",
          parent_group_id: null,
          name: "Business B Category",
        },
        {
          id: "subcategory-a",
          business_id: "business-a",
          menu_id: "menu-a",
          parent_group_id: "category-a",
          name: "Business A Subcategory",
        },
        {
          id: "subcategory-b",
          business_id: "business-b",
          menu_id: "menu-b",
          parent_group_id: "category-b",
          name: "Business B Subcategory",
        },
      ],
    }
  }

  function matches(row: Row, filters: Filter[]) {
    return filters.every((filter) => {
      if (filter.operator === "is") {
        return row[filter.column] === filter.value
      }

      if (filter.operator === "not-is") {
        return row[filter.column] !== filter.value
      }

      return row[filter.column] === filter.value
    })
  }

  class FakeQueryBuilder {
    private filters: Filter[] = []
    private operation:
      | { type: "insert"; records: Row[] }
      | { type: "update"; payload: Row }
      | null = null

    constructor(private table: string) {}

    select() {
      return this
    }

    eq(column: string, value: unknown) {
      this.filters.push({ column, operator: "eq", value })
      return this
    }

    is(column: string, value: unknown) {
      this.filters.push({ column, operator: "is", value })
      return this
    }

    not(column: string, operator: string, value: unknown) {
      if (operator !== "is") {
        throw new Error(`Unsupported operator ${operator}`)
      }

      this.filters.push({ column, operator: "not-is", value })
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

    single() {
      const row =
        (state.rowsByTable[this.table] ?? []).find((item) =>
          matches(item, this.filters)
        ) ?? null

      return Promise.resolve({
        data: row,
        error: row ? null : { message: "not found" },
      })
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

        return { data: null, error: null }
      }

      if (this.operation?.type === "update") {
        state.updates.push({
          table: this.table,
          payload: this.operation.payload,
          filters: this.filters,
        })

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
  }
})

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: actionMocks.supabaseAdmin,
}))

vi.mock("next/cache", () => ({
  revalidatePath: actionMocks.revalidatePath,
}))

function createCategoryFormData({
  businessSlug,
  categoryId,
}: {
  businessSlug?: string
  categoryId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  if (categoryId) formData.set("categoryId", categoryId)
  formData.set("name", "Pizza")
  formData.set("description", "Pizza products")
  formData.set("sortOrder", "2")
  formData.set("isEnabled", "true")

  return formData
}

function createSubcategoryFormData({
  businessSlug,
  subcategoryId,
  parentCategoryId = "category-a",
}: {
  businessSlug?: string
  subcategoryId?: string
  parentCategoryId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  if (subcategoryId) formData.set("subcategoryId", subcategoryId)
  formData.set("parentCategoryId", parentCategoryId)
  formData.set("name", "Specialty")
  formData.set("description", "Specialty products")
  formData.set("sortOrder", "3")
  formData.set("isEnabled", "true")

  return formData
}

describe("tenant-aware product category actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("saveProductCategory creates categories under the selected business", async () => {
    await saveProductCategory(
      createCategoryFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "menu_groups",
      records: [{ business_id: "business-a", menu_id: "menu-a" }],
    })
  })

  it("saveProductCategory keeps legacy demo fallback when businessSlug is omitted", async () => {
    await saveProductCategory(createCategoryFormData())

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "menu_groups",
      records: [{ business_id: "business-demo", menu_id: "menu-demo" }],
    })
  })

  it("saveProductCategory refuses updates from another business", async () => {
    await expect(
      saveProductCategory(
        createCategoryFormData({
          businessSlug: "randys-pizza",
          categoryId: "category-b",
        })
      )
    ).rejects.toThrow("Category could not be found.")

    expect(actionMocks.state.updates).toEqual([])
  })

  it("saveProductCategory scoped revalidations include businessSlug", async () => {
    await saveProductCategory(
      createCategoryFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/categories"
    )
    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/subcategories"
    )
  })
})

describe("tenant-aware product subcategory actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("saveProductSubcategory creates subcategories under the selected business", async () => {
    await saveProductSubcategory(
      createSubcategoryFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "menu_groups",
      records: [
        {
          business_id: "business-a",
          menu_id: "menu-a",
          parent_group_id: "category-a",
        },
      ],
    })
  })

  it("saveProductSubcategory validates parent category business ownership", async () => {
    await expect(
      saveProductSubcategory(
        createSubcategoryFormData({
          businessSlug: "randys-pizza",
          parentCategoryId: "category-b",
        })
      )
    ).rejects.toThrow("Selected parent category is invalid.")

    expect(actionMocks.state.inserts).toEqual([])
  })

  it("saveProductSubcategory refuses updates from another business", async () => {
    await expect(
      saveProductSubcategory(
        createSubcategoryFormData({
          businessSlug: "randys-pizza",
          subcategoryId: "subcategory-b",
        })
      )
    ).rejects.toThrow("Subcategory could not be found.")

    expect(actionMocks.state.updates).toEqual([])
  })

  it("saveProductSubcategory scoped revalidations include businessSlug", async () => {
    await saveProductSubcategory(
      createSubcategoryFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/categories"
    )
    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/subcategories"
    )
  })
})
