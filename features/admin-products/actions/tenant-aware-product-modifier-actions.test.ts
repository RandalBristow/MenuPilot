import { beforeEach, describe, expect, it, vi } from "vitest"
import { setProductDefaultModifierOption } from "./save-product-default-modifier-option"
import { saveProductIncludedModifierGroup } from "./save-product-included-modifier-group"
import {
  attachProductModifierGroup,
  detachProductModifierGroup,
} from "./save-product-modifier-group-assignment"
import {
  setProductVariantModifierOptionAvailability,
  setProductVariantModifierOptionPriceOverride,
} from "./save-product-variant-modifier-option-availability"

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
        { id: "product-demo", business_id: "business-demo" },
      ],
      modifier_groups: [
        {
          id: "modifier-group-a",
          business_id: "business-a",
          selection_type: "multiple",
          max_allowed: null,
        },
        {
          id: "modifier-group-b",
          business_id: "business-b",
          selection_type: "multiple",
          max_allowed: null,
        },
        {
          id: "modifier-group-demo",
          business_id: "business-demo",
          selection_type: "multiple",
          max_allowed: null,
        },
      ],
      modifier_options: [
        {
          id: "modifier-option-a",
          business_id: "business-a",
          modifier_group_id: "modifier-group-a",
        },
        {
          id: "modifier-option-a-two",
          business_id: "business-a",
          modifier_group_id: "modifier-group-a",
        },
        {
          id: "modifier-option-b",
          business_id: "business-b",
          modifier_group_id: "modifier-group-b",
        },
      ],
      product_modifier_groups: [
        {
          id: "assignment-a",
          business_id: "business-a",
          product_id: "product-a",
          modifier_group_id: "modifier-group-a",
          is_enabled: true,
          sort_order: 0,
        },
        {
          id: "assignment-b",
          business_id: "business-b",
          product_id: "product-b",
          modifier_group_id: "modifier-group-b",
          is_enabled: true,
          sort_order: 0,
        },
      ],
      product_included_modifier_groups: [
        {
          id: "included-a",
          business_id: "business-a",
          product_id: "product-a",
          modifier_group_id: "modifier-group-a",
        },
      ],
      product_default_modifier_options: [],
      product_modifier_option_overrides: [],
      variant_group_options: [
        {
          id: "variant-option-a",
          business_id: "business-a",
          variant_group_id: "variant-group-a",
        },
        {
          id: "variant-option-b",
          business_id: "business-b",
          variant_group_id: "variant-group-b",
        },
      ],
      product_variant_groups: [
        {
          id: "variant-assignment-a",
          business_id: "business-a",
          product_id: "product-a",
          variant_group_id: "variant-group-a",
          is_enabled: true,
        },
        {
          id: "variant-assignment-b",
          business_id: "business-b",
          product_id: "product-b",
          variant_group_id: "variant-group-b",
          is_enabled: true,
        },
      ],
      product_variant_modifier_option_availability_rules: [],
      product_variant_modifier_option_price_overrides: [],
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
    private maxRows: number | null = null

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

    order() {
      return this
    }

    limit(count: number) {
      this.maxRows = count
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

      const rows = (state.rowsByTable[this.table] ?? []).filter((row) =>
        matches(row, this.filters)
      )

      return {
        data: this.maxRows === null ? rows : rows.slice(0, this.maxRows),
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

function createModifierAssignmentFormData({
  businessSlug,
  productId = "product-a",
  modifierGroupId = "modifier-group-a",
}: {
  businessSlug?: string
  productId?: string
  modifierGroupId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  formData.set("productId", productId)
  formData.set("modifierGroupId", modifierGroupId)

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

function createIncludedFormData({
  businessSlug,
  productId = "product-a",
  modifierGroupId = "modifier-group-a",
  clear = false,
}: {
  businessSlug?: string
  productId?: string
  modifierGroupId?: string
  clear?: boolean
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  formData.set("productId", productId)
  formData.set("modifierGroupId", modifierGroupId)
  formData.set("includedQuantity", "2")
  formData.set("chargeForExtra", "true")
  if (clear) formData.set("clearIncludedRule", "true")

  return formData
}

function createDefaultFormData({
  businessSlug,
  productId = "product-a",
  modifierGroupId = "modifier-group-a",
  modifierOptionId = "modifier-option-a",
}: {
  businessSlug?: string
  productId?: string
  modifierGroupId?: string
  modifierOptionId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  formData.set("productId", productId)
  formData.set("modifierGroupId", modifierGroupId)
  formData.set("modifierOptionId", modifierOptionId)
  formData.set("isDefault", "true")

  return formData
}

function createVariantModifierFormData({
  businessSlug,
  productId = "product-a",
  variantGroupId = "variant-group-a",
  variantGroupOptionId = "variant-option-a",
  modifierGroupId = "modifier-group-a",
  modifierOptionId = "modifier-option-a",
}: {
  businessSlug?: string
  productId?: string
  variantGroupId?: string
  variantGroupOptionId?: string
  modifierGroupId?: string
  modifierOptionId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  formData.set("productId", productId)
  formData.set("variantGroupId", variantGroupId)
  formData.set("variantGroupOptionId", variantGroupOptionId)
  formData.set("modifierGroupId", modifierGroupId)
  formData.set("modifierOptionId", modifierOptionId)
  formData.set("isAvailable", "false")
  formData.set("priceDelta", "2.5")

  return formData
}

describe("tenant-aware product modifier assignment actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("attachProductModifierGroup validates product ownership", async () => {
    await expect(
      attachProductModifierGroup(
        createModifierAssignmentFormData({
          businessSlug: "randys-pizza",
          productId: "product-b",
        })
      )
    ).rejects.toThrow("Selected product is invalid.")

    expect(actionMocks.state.upserts).toEqual([])
  })

  it("attachProductModifierGroup validates modifier group ownership", async () => {
    await expect(
      attachProductModifierGroup(
        createModifierAssignmentFormData({
          businessSlug: "randys-pizza",
          modifierGroupId: "modifier-group-b",
        })
      )
    ).rejects.toThrow("Selected modifier group is invalid.")

    expect(actionMocks.state.upserts).toEqual([])
  })

  it("attachProductModifierGroup writes the selected business_id", async () => {
    await attachProductModifierGroup(
      createModifierAssignmentFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.upserts[0]).toMatchObject({
      table: "product_modifier_groups",
      records: [{ business_id: "business-a" }],
    })
  })

  it("attachProductModifierGroup keeps legacy demo fallback", async () => {
    await attachProductModifierGroup(
      createModifierAssignmentFormData({
        productId: "product-demo",
        modifierGroupId: "modifier-group-demo",
      })
    )

    expect(actionMocks.state.upserts[0]).toMatchObject({
      table: "product_modifier_groups",
      records: [{ business_id: "business-demo" }],
    })
  })

  it("detachProductModifierGroup refuses assignments from another business", async () => {
    await expect(
      detachProductModifierGroup(
        createDetachFormData({
          businessSlug: "randys-pizza",
          assignmentId: "assignment-b",
        })
      )
    ).rejects.toThrow("Selected modifier group assignment is invalid.")

    expect(actionMocks.state.deletes).toEqual([])
  })
})

describe("tenant-aware product included and default modifier actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("saveProductIncludedModifierGroup writes selected business context", async () => {
    const result = await saveProductIncludedModifierGroup(
      createIncludedFormData({ businessSlug: "randys-pizza" })
    )

    expect(result.ok).toBe(true)
    expect(actionMocks.state.updates[0]).toMatchObject({
      table: "product_included_modifier_groups",
      payload: { included_quantity: 2, charge_for_extra: true },
    })
  })

  it("saveProductIncludedModifierGroup clear refuses cross-tenant data", async () => {
    const result = await saveProductIncludedModifierGroup(
      createIncludedFormData({
        businessSlug: "randys-pizza",
        productId: "product-b",
        modifierGroupId: "modifier-group-b",
        clear: true,
      })
    )

    expect(result).toMatchObject({
      ok: false,
      message: "Selected modifier group assignment is invalid.",
    })
    expect(actionMocks.state.deletes).toEqual([])
  })

  it("setProductDefaultModifierOption validates option ownership", async () => {
    await expect(
      setProductDefaultModifierOption(
        createDefaultFormData({
          businessSlug: "randys-pizza",
          modifierOptionId: "modifier-option-b",
        })
      )
    ).rejects.toThrow("Selected modifier option is invalid.")

    expect(actionMocks.state.upserts).toEqual([])
  })

  it("setProductDefaultModifierOption writes selected business_id", async () => {
    await setProductDefaultModifierOption(
      createDefaultFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.upserts[0]).toMatchObject({
      table: "product_default_modifier_options",
      records: [{ business_id: "business-a" }],
    })
  })
})

describe("tenant-aware variant modifier rules", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("setProductVariantModifierOptionAvailability validates submitted IDs", async () => {
    await expect(
      setProductVariantModifierOptionAvailability(
        createVariantModifierFormData({
          businessSlug: "randys-pizza",
          modifierOptionId: "modifier-option-b",
        })
      )
    ).rejects.toThrow("Selected modifier availability context is invalid.")

    expect(actionMocks.state.upserts).toEqual([])
  })

  it("setProductVariantModifierOptionAvailability writes selected business_id", async () => {
    await setProductVariantModifierOptionAvailability(
      createVariantModifierFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.upserts[0]).toMatchObject({
      table: "product_variant_modifier_option_availability_rules",
      records: [{ business_id: "business-a" }],
    })
  })

  it("setProductVariantModifierOptionPriceOverride validates submitted IDs", async () => {
    await expect(
      setProductVariantModifierOptionPriceOverride(
        createVariantModifierFormData({
          businessSlug: "randys-pizza",
          variantGroupOptionId: "variant-option-b",
        })
      )
    ).rejects.toThrow("Selected modifier availability context is invalid.")

    expect(actionMocks.state.upserts).toEqual([])
  })

  it("setProductVariantModifierOptionPriceOverride writes selected business_id", async () => {
    await setProductVariantModifierOptionPriceOverride(
      createVariantModifierFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.upserts[0]).toMatchObject({
      table: "product_variant_modifier_option_price_overrides",
      records: [{ business_id: "business-a" }],
    })
  })

  it("scoped revalidations include businessSlug", async () => {
    await setProductVariantModifierOptionPriceOverride(
      createVariantModifierFormData({ businessSlug: "randys-pizza" })
    )

    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/modifier-groups/modifier-group-a/availability?productId=product-a"
    )
  })
})
