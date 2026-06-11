import { beforeEach, describe, expect, it, vi } from "vitest"
import { setModifierOptionOperationalAvailability } from "./set-modifier-option-operational-availability"
import { setProductOperationalAvailability } from "./set-product-operational-availability"

const actionMocks = vi.hoisted(() => {
  type Row = Record<string, unknown>
  type Filter = {
    column: string
    value: unknown
    mode: "eq" | "is"
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
      businesses: [{ id: "business-a", slug: "randys-pizza" }],
      products: [{ id: "product-a", business_id: "business-a" }],
      modifier_options: [
        {
          id: "option-a",
          business_id: "business-a",
          modifier_group_id: "group-a",
        },
      ],
      product_operational_availability: [],
      modifier_option_operational_availability: [],
    }
  }

  function matches(row: Row, filters: Filter[]) {
    return filters.every((filter) => {
      if (filter.mode === "is") return row[filter.column] === filter.value

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
      this.filters.push({ column, value, mode: "eq" })
      return this
    }

    is(column: string, value: unknown) {
      this.filters.push({ column, value, mode: "is" })
      return this
    }

    insert(payload: Row | Row[]) {
      this.operation = {
        type: "insert",
        records: Array.isArray(payload) ? payload : [payload],
      }
      return this.resolveMutation()
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

    maybeSingle() {
      const row =
        (state.rowsByTable[this.table] ?? []).find((item) =>
          matches(item, this.filters)
        ) ?? null

      return Promise.resolve({ data: row, error: null })
    }

    then<TResult1 = { data: null; error: null }>(
      onfulfilled?: (value: { data: null; error: null }) => TResult1
    ) {
      return Promise.resolve(this.resolveMutation()).then(onfulfilled)
    }

    private resolveMutation() {
      if (this.operation?.type === "insert") {
        state.inserts.push({
          table: this.table,
          records: this.operation.records,
        })
        state.rowsByTable[this.table]?.push(...this.operation.records)
      }

      if (this.operation?.type === "update") {
        state.updates.push({
          table: this.table,
          payload: this.operation.payload,
          filters: this.filters,
        })
      }

      return { data: null, error: null }
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

function productFormData(is86d = "true") {
  const formData = new FormData()

  formData.set("businessSlug", "randys-pizza")
  formData.set("productId", "product-a")
  formData.set("is86d", is86d)
  formData.set("reason", "Sold out")
  formData.set("expiresAt", "2026-06-10T18:00")

  return formData
}

function optionFormData(is86d = "true") {
  const formData = new FormData()

  formData.set("businessSlug", "randys-pizza")
  formData.set("optionId", "option-a")
  formData.set("modifierGroupId", "group-a")
  formData.set("is86d", is86d)
  formData.set("reason", "Out for the shift")

  return formData
}

describe("operational availability actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("creates a product 86 override", async () => {
    await setProductOperationalAvailability(productFormData())

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "product_operational_availability",
      records: [
        {
          business_id: "business-a",
          product_id: "product-a",
          is_86d: true,
          reason: "Sold out",
        },
      ],
    })
  })

  it("clears an existing product 86 override", async () => {
    actionMocks.state.rowsByTable.product_operational_availability = [
      {
        id: "availability-a",
        business_id: "business-a",
        location_id: null,
        product_id: "product-a",
        is_86d: true,
      },
    ]

    await setProductOperationalAvailability(productFormData("false"))

    expect(actionMocks.state.updates[0]).toMatchObject({
      table: "product_operational_availability",
      payload: {
        is_86d: false,
        reason: null,
        expires_at: null,
      },
    })
  })

  it("creates a modifier option 86 override", async () => {
    await setModifierOptionOperationalAvailability(optionFormData())

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "modifier_option_operational_availability",
      records: [
        {
          business_id: "business-a",
          modifier_option_id: "option-a",
          is_86d: true,
          reason: "Out for the shift",
        },
      ],
    })
  })

  it("clears an existing modifier option 86 override", async () => {
    actionMocks.state.rowsByTable.modifier_option_operational_availability = [
      {
        id: "availability-a",
        business_id: "business-a",
        location_id: null,
        modifier_option_id: "option-a",
        is_86d: true,
      },
    ]

    await setModifierOptionOperationalAvailability(optionFormData("false"))

    expect(actionMocks.state.updates[0]).toMatchObject({
      table: "modifier_option_operational_availability",
      payload: {
        is_86d: false,
        reason: null,
        expires_at: null,
      },
    })
  })
})
