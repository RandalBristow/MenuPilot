import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  detachProductVariantGroupAssignment,
  saveProductVariantOptionOverride,
  selectProductVariantGroupAssignment,
} from "./save-product-variant-group-assignment"
import { saveVariantGroup } from "./save-variant-group"
import { saveVariantGroupOption } from "./save-variant-group-option"

const actionMocks = vi.hoisted(() => {
  type Row = Record<string, unknown>
  type Filter = {
    column: string
    operator: "eq" | "neq" | "in"
    value?: unknown
    values?: unknown[]
  }

  const state = {
    revalidated: [] as string[],
    inserts: [] as Array<{ table: string; records: Row[] }>,
    updates: [] as Array<{ table: string; payload: Row; filters: Filter[] }>,
    deletes: [] as Array<{ table: string; filters: Filter[] }>,
    upserts: [] as Array<{ table: string; records: Row[] }>,
    rowsByTable: {} as Record<string, Row[]>,
  }

  function reset() {
    state.revalidated = []
    state.inserts = []
    state.updates = []
    state.deletes = []
    state.upserts = []
    state.rowsByTable = {
      businesses: [
        { id: "business-demo", slug: "pronto-demo" },
        { id: "business-a", slug: "randys-pizza" },
        { id: "business-b", slug: "other-business" },
      ],
      products: [
        { id: "product-a", business_id: "business-a" },
        { id: "product-b", business_id: "business-b" },
      ],
      variant_groups: [
        { id: "group-a", business_id: "business-a" },
        { id: "group-b", business_id: "business-b" },
        { id: "group-demo", business_id: "business-demo" },
      ],
      variant_group_options: [
        {
          id: "option-a",
          business_id: "business-a",
          variant_group_id: "group-a",
          is_default: true,
        },
        {
          id: "option-a-two",
          business_id: "business-a",
          variant_group_id: "group-a",
          is_default: false,
        },
        {
          id: "option-b",
          business_id: "business-b",
          variant_group_id: "group-b",
          is_default: true,
        },
      ],
      product_variant_groups: [
        {
          id: "assignment-a",
          business_id: "business-a",
          product_id: "product-a",
          variant_group_id: "group-a",
          is_enabled: true,
        },
        {
          id: "assignment-b",
          business_id: "business-b",
          product_id: "product-b",
          variant_group_id: "group-b",
          is_enabled: true,
        },
      ],
      product_variant_option_overrides: [],
    }
  }

  function matches(row: Row, filters: Filter[]) {
    return filters.every((filter) => {
      if (filter.operator === "neq") {
        return row[filter.column] !== filter.value
      }

      if (filter.operator === "in") {
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
      | { type: "upsert"; records: Row[] }
      | null = null

    constructor(private table: string) {}

    select() {
      return this
    }

    eq(column: string, value: unknown) {
      this.filters.push({ column, operator: "eq", value })
      return this
    }

    neq(column: string, value: unknown) {
      this.filters.push({ column, operator: "neq", value })
      return this
    }

    in(column: string, values: unknown[]) {
      this.filters.push({ column, operator: "in", values })
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

    upsert(payload: Row | Row[]) {
      const records = Array.isArray(payload) ? payload : [payload]
      this.operation = { type: "upsert", records }
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

      if (this.operation?.type === "delete") {
        state.deletes.push({ table: this.table, filters: this.filters })

        return { data: null, error: null }
      }

      if (this.operation?.type === "upsert") {
        state.upserts.push({
          table: this.table,
          records: this.operation.records,
        })
        state.rowsByTable[this.table]?.push(...this.operation.records)

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

function createVariantGroupFormData({
  businessSlug,
  groupId,
}: {
  businessSlug?: string
  groupId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  if (groupId) formData.set("groupId", groupId)
  formData.set("name", "Pizza Sizes")
  formData.set("description", "Pizza size choices")
  formData.set("sortOrder", "1")
  formData.set("isEnabled", "true")

  return formData
}

function createVariantOptionFormData({
  businessSlug,
  groupId = "group-a",
  optionId,
}: {
  businessSlug?: string
  groupId?: string
  optionId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  if (optionId) formData.set("optionId", optionId)
  formData.set("groupId", groupId)
  formData.set("name", "12 inch")
  formData.set("basePrice", "12.99")
  formData.set("sortOrder", "2")
  formData.set("isEnabled", "true")
  formData.set("isDefault", "false")

  return formData
}

function createAssignmentFormData({
  businessSlug,
  productId = "product-a",
  variantGroupId = "group-a",
}: {
  businessSlug?: string
  productId?: string
  variantGroupId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  formData.set("productId", productId)
  formData.set("variantGroupId", variantGroupId)

  return formData
}

function createDetachFormData({
  businessSlug,
  productId = "product-a",
  assignmentId = "assignment-a",
}: {
  businessSlug?: string
  productId?: string
  assignmentId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  formData.set("productId", productId)
  formData.set("assignmentId", assignmentId)

  return formData
}

function createOverrideFormData({
  businessSlug,
  productId = "product-a",
  optionId = "option-a",
}: {
  businessSlug?: string
  productId?: string
  optionId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  formData.set("productId", productId)
  formData.set("variantGroupOptionId", optionId)
  formData.set("priceOverride", "13.99")
  formData.set("prepTimeMinutesOverride", "2")
  formData.set("isEnabled", "true")
  formData.set("isDefault", "false")
  formData.set("sortOrder", "1")

  return formData
}

describe("tenant-aware variant group actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("saveVariantGroup creates variant groups under the selected business", async () => {
    await saveVariantGroup(
      createVariantGroupFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "variant_groups",
      records: [{ business_id: "business-a" }],
    })
  })

  it("saveVariantGroup keeps legacy demo fallback when businessSlug is omitted", async () => {
    await saveVariantGroup(createVariantGroupFormData())

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "variant_groups",
      records: [{ business_id: "business-demo" }],
    })
  })

  it("saveVariantGroup refuses updates from another business", async () => {
    await expect(
      saveVariantGroup(
        createVariantGroupFormData({
          businessSlug: "randys-pizza",
          groupId: "group-b",
        })
      )
    ).rejects.toThrow("Selected variant group is invalid.")

    expect(actionMocks.state.updates).toEqual([])
  })

  it("saveVariantGroup scoped revalidations include businessSlug", async () => {
    await saveVariantGroup(
      createVariantGroupFormData({
        businessSlug: "randys-pizza",
        groupId: "group-a",
      })
    )

    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/variant-groups"
    )
    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/variant-groups/group-a"
    )
  })
})

describe("tenant-aware variant group option actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("saveVariantGroupOption validates parent group ownership before create", async () => {
    await expect(
      saveVariantGroupOption(
        createVariantOptionFormData({
          businessSlug: "randys-pizza",
          groupId: "group-b",
        })
      )
    ).rejects.toThrow("Selected variant group is invalid.")

    expect(actionMocks.state.inserts).toEqual([])
  })

  it("saveVariantGroupOption creates options under the selected business", async () => {
    await saveVariantGroupOption(
      createVariantOptionFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "variant_group_options",
      records: [{ business_id: "business-a", variant_group_id: "group-a" }],
    })
  })

  it("saveVariantGroupOption refuses updates from another business", async () => {
    await expect(
      saveVariantGroupOption(
        createVariantOptionFormData({
          businessSlug: "randys-pizza",
          groupId: "group-a",
          optionId: "option-b",
        })
      )
    ).rejects.toThrow("Selected variant group option is invalid.")

    expect(actionMocks.state.updates).toEqual([])
  })
})

describe("tenant-aware product variant assignment actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("selectProductVariantGroupAssignment validates product ownership", async () => {
    await expect(
      selectProductVariantGroupAssignment(
        createAssignmentFormData({
          businessSlug: "randys-pizza",
          productId: "product-b",
          variantGroupId: "group-a",
        })
      )
    ).rejects.toThrow("Selected product is invalid.")

    expect(actionMocks.state.upserts).toEqual([])
  })

  it("selectProductVariantGroupAssignment validates variant group ownership", async () => {
    await expect(
      selectProductVariantGroupAssignment(
        createAssignmentFormData({
          businessSlug: "randys-pizza",
          variantGroupId: "group-b",
        })
      )
    ).rejects.toThrow("Selected variant group is invalid.")

    expect(actionMocks.state.upserts).toEqual([])
  })

  it("selectProductVariantGroupAssignment writes selected business_id", async () => {
    await selectProductVariantGroupAssignment(
      createAssignmentFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.upserts[0]).toMatchObject({
      table: "product_variant_groups",
      records: [{ business_id: "business-a" }],
    })
  })

  it("detachProductVariantGroupAssignment refuses assignments from another business", async () => {
    await expect(
      detachProductVariantGroupAssignment(
        createDetachFormData({
          businessSlug: "randys-pizza",
          assignmentId: "assignment-b",
        })
      )
    ).rejects.toThrow("Selected variant group assignment is invalid.")

    expect(actionMocks.state.deletes).toEqual([])
  })

  it("saveProductVariantOptionOverride validates product and option ownership", async () => {
    await expect(
      saveProductVariantOptionOverride(
        createOverrideFormData({
          businessSlug: "randys-pizza",
          optionId: "option-b",
        })
      )
    ).rejects.toThrow("Selected variant option is invalid.")

    expect(actionMocks.state.upserts).toEqual([])
  })

  it("saveProductVariantOptionOverride writes selected business_id", async () => {
    await saveProductVariantOptionOverride(
      createOverrideFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.upserts[0]).toMatchObject({
      table: "product_variant_option_overrides",
      records: [{ business_id: "business-a" }],
    })
  })

  it("variant assignment scoped revalidations include businessSlug", async () => {
    await selectProductVariantGroupAssignment(
      createAssignmentFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/variant-assignments"
    )
    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/product-a"
    )
  })
})
