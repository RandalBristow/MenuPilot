import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildDefaultProductMenuInsert,
  getOrCreateProductMenuId,
} from "@/features/admin-products/utils/product-menu"

const productMenuMocks = vi.hoisted(() => {
  type Row = Record<string, unknown>
  type Filter = {
    column: string
    value: unknown
  }

  const state = {
    inserts: [] as Row[],
    rows: [] as Row[],
  }

  function reset() {
    state.inserts = []
    state.rows = [
      {
        id: "menu-existing",
        business_id: "business-a",
        name: "Main Menu",
      },
      {
        id: "menu-other",
        business_id: "business-b",
        name: "Main Menu",
      },
    ]
  }

  function matches(row: Row, filters: Filter[]) {
    return filters.every((filter) => row[filter.column] === filter.value)
  }

  class FakeQueryBuilder {
    private filters: Filter[] = []
    private insertPayload: Row | null = null

    select() {
      return this
    }

    eq(column: string, value: unknown) {
      this.filters.push({ column, value })
      return this
    }

    insert(payload: Row) {
      this.insertPayload = payload
      return this
    }

    maybeSingle() {
      const row = state.rows.find((item) => matches(item, this.filters)) ?? null

      return Promise.resolve({
        data: row,
        error: null,
      })
    }

    single() {
      if (!this.insertPayload) {
        return Promise.resolve({
          data: null,
          error: { message: "not found" },
        })
      }

      const row = {
        id: `menu-created-${state.inserts.length + 1}`,
        ...this.insertPayload,
      }

      state.inserts.push(row)
      state.rows.push(row)

      return Promise.resolve({
        data: row,
        error: null,
      })
    }
  }

  return {
    reset,
    state,
    supabaseAdmin: {
      from: (table: string) => {
        if (table !== "menus") {
          throw new Error(`Unexpected table ${table}`)
        }

        return new FakeQueryBuilder()
      },
    },
  }
})

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: productMenuMocks.supabaseAdmin,
}))

describe("product menu helper", () => {
  beforeEach(() => {
    productMenuMocks.reset()
  })

  it("returns an existing default product menu", async () => {
    await expect(getOrCreateProductMenuId("business-a")).resolves.toBe(
      "menu-existing"
    )

    expect(productMenuMocks.state.inserts).toEqual([])
  })

  it("creates a default product menu when missing", async () => {
    await expect(getOrCreateProductMenuId("business-new")).resolves.toBe(
      "menu-created-1"
    )

    expect(productMenuMocks.state.inserts).toEqual([
      {
        id: "menu-created-1",
        ...buildDefaultProductMenuInsert("business-new"),
      },
    ])
  })

  it("does not reuse a sibling business menu", async () => {
    await expect(getOrCreateProductMenuId("business-c")).resolves.toBe(
      "menu-created-1"
    )

    expect(productMenuMocks.state.inserts[0]).toMatchObject({
      business_id: "business-c",
      name: "Main Menu",
    })
  })
})
