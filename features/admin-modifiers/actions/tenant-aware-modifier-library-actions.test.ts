import { beforeEach, describe, expect, it, vi } from "vitest"
import { createModifierCategory } from "@/features/admin-modifiers/actions/create-modifier-category"
import { updateModifierCategory } from "@/features/admin-modifiers/actions/update-modifier-category"
import { createModifierGroup } from "@/features/admin-modifiers/actions/create-modifier-group"
import { updateModifierGroup } from "@/features/admin-modifiers/actions/update-modifier-group"
import { createModifierOptionGroup } from "@/features/admin-modifiers/actions/create-modifier-option-group"
import { createModifierOption } from "@/features/admin-modifiers/actions/create-modifier-option"
import { deleteModifierOption } from "@/features/admin-modifiers/actions/delete-modifier-option"

const actionMocks = vi.hoisted(() => {
  type Row = Record<string, unknown>
  type Filter = {
    column: string
    value: unknown
  }

  const state = {
    revalidated: [] as string[],
    inserts: [] as Array<{ table: string; records: Row[] }>,
    updates: [] as Array<{ table: string; payload: Row; filters: Filter[] }>,
    deletes: [] as Array<{ table: string; filters: Filter[] }>,
    rowsByTable: {} as Record<string, Row[]>,
  }

  function reset() {
    state.revalidated = []
    state.inserts = []
    state.updates = []
    state.deletes = []
    state.rowsByTable = {
      businesses: [
        { id: "business-demo", slug: "pronto-demo" },
        { id: "business-a", slug: "randys-pizza" },
        { id: "business-b", slug: "other-business" },
      ],
      modifier_categories: [
        {
          id: "category-a",
          business_id: "business-a",
          name: "Pizza",
          sort_order: 2,
        },
        {
          id: "category-b",
          business_id: "business-b",
          name: "Wings",
          sort_order: 1,
        },
      ],
      modifier_groups: [
        {
          id: "group-a",
          business_id: "business-a",
          modifier_category_id: "category-a",
          name: "Pizza Toppings",
          sort_order: 1,
        },
        {
          id: "group-b",
          business_id: "business-b",
          modifier_category_id: "category-b",
          name: "Wing Sauce",
          sort_order: 1,
        },
      ],
      modifier_option_groups: [
        {
          id: "list-a",
          business_id: "business-a",
          modifier_group_id: "group-a",
          name: "Veggies",
          sort_order: 1,
        },
        {
          id: "list-b",
          business_id: "business-b",
          modifier_group_id: "group-b",
          name: "Sauces",
          sort_order: 1,
        },
      ],
      modifier_options: [
        {
          id: "option-a",
          business_id: "business-a",
          modifier_group_id: "group-a",
          modifier_option_group_id: "list-a",
          name: "Tomato",
          sort_order: 1,
        },
        {
          id: "option-b",
          business_id: "business-b",
          modifier_group_id: "group-b",
          modifier_option_group_id: "list-b",
          name: "BBQ",
          sort_order: 1,
        },
      ],
      product_default_modifier_options: [],
      product_modifier_option_overrides: [],
      product_variant_modifier_option_availability: [],
      order_item_modifiers: [],
    }
  }

  function matches(row: Row, filters: Filter[]) {
    return filters.every((filter) => row[filter.column] === filter.value)
  }

  class FakeQueryBuilder {
    private filters: Filter[] = []
    private selectedOrder: { column: string; ascending: boolean } | null = null
    private selectedLimit: number | null = null
    private operation:
      | { type: "insert"; records: Row[] }
      | { type: "update"; payload: Row }
      | { type: "delete" }
      | null = null

    constructor(private table: string) {}

    select() {
      return this
    }

    eq(column: string, value: unknown) {
      this.filters.push({ column, value })
      return this
    }

    order(column: string, options?: { ascending?: boolean }) {
      this.selectedOrder = {
        column,
        ascending: options?.ascending ?? true,
      }
      return this
    }

    limit(value: number) {
      this.selectedLimit = value
      return this
    }

    insert(payload: Row | Row[]) {
      this.operation = {
        type: "insert",
        records: Array.isArray(payload) ? payload : [payload],
      }
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
      const row = this.resolveRows()[0] ?? null

      return Promise.resolve({
        data: row,
        error: row ? null : { message: "not found" },
      })
    }

    then<TResult1 = { data: Row[] | null; error: null }>(
      onfulfilled?: (value: { data: Row[] | null; error: null }) => TResult1
    ) {
      return Promise.resolve(this.resolve()).then(onfulfilled)
    }

    private resolveRows() {
      let rows = (state.rowsByTable[this.table] ?? []).filter((row) =>
        matches(row, this.filters)
      )

      if (this.selectedOrder) {
        const { column, ascending } = this.selectedOrder

        rows = [...rows].sort((first, second) => {
          const firstValue = Number(first[column] ?? 0)
          const secondValue = Number(second[column] ?? 0)

          return ascending ? firstValue - secondValue : secondValue - firstValue
        })
      }

      if (this.selectedLimit !== null) {
        rows = rows.slice(0, this.selectedLimit)
      }

      return rows
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
        state.deletes.push({
          table: this.table,
          filters: this.filters,
        })

        return { data: null, error: null }
      }

      return {
        data: this.resolveRows(),
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

function categoryFormData({
  businessSlug = "randys-pizza",
  categoryId,
}: {
  businessSlug?: string
  categoryId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  if (categoryId) formData.set("categoryId", categoryId)
  formData.set("name", "Pizza")
  formData.set("description", "Pizza modifiers")

  return formData
}

function groupFormData({
  businessSlug = "randys-pizza",
  categoryId = "category-a",
  modifierGroupId,
  supportsPlacement = "true",
  supportsMultiplier = "true",
  minMultiplier = "1",
  maxMultiplier = "3",
  multiplierStep = "1",
}: {
  businessSlug?: string
  categoryId?: string
  modifierGroupId?: string
  supportsPlacement?: string
  supportsMultiplier?: string
  minMultiplier?: string
  maxMultiplier?: string
  multiplierStep?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  if (modifierGroupId) formData.set("modifierGroupId", modifierGroupId)
  formData.set("categoryId", categoryId)
  formData.set("name", "Pizza Toppings")
  formData.set("selectionType", "multiple")
  formData.set("isRequired", "false")
  formData.set("minRequired", "0")
  formData.set("maxAllowed", "")
  formData.set("supportsPlacement", supportsPlacement)
  formData.set("supportsMultiplier", supportsMultiplier)
  formData.set("minMultiplier", minMultiplier)
  formData.set("maxMultiplier", maxMultiplier)
  formData.set("multiplierStep", multiplierStep)
  formData.set("sortOrder", "2")
  formData.set("isEnabled", "true")

  return formData
}

function optionGroupFormData({
  businessSlug = "randys-pizza",
  modifierGroupId = "group-a",
}: {
  businessSlug?: string
  modifierGroupId?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  formData.set("modifierGroupId", modifierGroupId)
  formData.set("name", "Veggies")
  formData.set("description", "Vegetable toppings")
  formData.set("sortOrder", "2")
  formData.set("isEnabled", "true")

  return formData
}

function optionFormData({
  businessSlug = "randys-pizza",
  modifierGroupId = "group-a",
  modifierOptionGroupId = "list-a",
  name = "Onion",
}: {
  businessSlug?: string
  modifierGroupId?: string
  modifierOptionGroupId?: string
  name?: string
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  formData.set("modifierGroupId", modifierGroupId)
  formData.set("modifierOptionGroupId", modifierOptionGroupId)
  formData.set("name", name)
  formData.set("priceDelta", "1.25")
  formData.set("sortOrder", "2")

  return formData
}

describe("tenant-aware modifier library actions", () => {
  beforeEach(() => {
    actionMocks.reset()
  })

  it("creates modifier categories under the selected business", async () => {
    await createModifierCategory(categoryFormData())

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "modifier_categories",
      records: [{ business_id: "business-a", name: "Pizza" }],
    })
  })

  it("keeps legacy demo fallback when businessSlug is omitted", async () => {
    await createModifierCategory(categoryFormData({ businessSlug: "" }))

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "modifier_categories",
      records: [{ business_id: "business-demo" }],
    })
  })

  it("refuses category updates from another business", async () => {
    await expect(
      updateModifierCategory(
        categoryFormData({
          businessSlug: "randys-pizza",
          categoryId: "category-b",
        })
      )
    ).rejects.toThrow("Selected modifier category is invalid.")
  })

  it("validates modifier group category ownership before create", async () => {
    await expect(
      createModifierGroup(groupFormData({ categoryId: "category-b" }))
    ).rejects.toThrow("Selected modifier category is invalid.")
  })

  it("creates modifier groups with placement and multiplier settings", async () => {
    await createModifierGroup(groupFormData())

    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "modifier_groups",
      records: [
        {
          business_id: "business-a",
          supports_placement: true,
          supports_multiplier: true,
          min_multiplier: 1,
          max_multiplier: 3,
          multiplier_step: 1,
        },
      ],
    })
  })

  it("updates modifier group placement and multiplier settings", async () => {
    await updateModifierGroup(
      groupFormData({
        modifierGroupId: "group-a",
        supportsPlacement: "false",
        supportsMultiplier: "false",
        minMultiplier: "1",
        maxMultiplier: "1",
        multiplierStep: "1",
      })
    )

    expect(actionMocks.state.updates[0]).toMatchObject({
      table: "modifier_groups",
      payload: {
        supports_placement: false,
        supports_multiplier: false,
        min_multiplier: 1,
        max_multiplier: 1,
        multiplier_step: 1,
      },
    })
  })

  it("validates option group parent ownership before create", async () => {
    await expect(
      createModifierOptionGroup(optionGroupFormData({ modifierGroupId: "group-b" }))
    ).rejects.toThrow("Selected modifier group is invalid.")
  })

  it("validates modifier option list ownership before create", async () => {
    const result = await createModifierOption(
      optionFormData({ modifierOptionGroupId: "list-b" })
    )

    expect(result).toMatchObject({
      status: "error",
      message: "Selected Modifier Option Group/List is invalid.",
    })
  })

  it("refuses duplicate modifier option names within the same option list", async () => {
    const result = await createModifierOption(optionFormData({ name: "Tomato" }))

    expect(result).toMatchObject({
      status: "error",
      message:
        "A modifier option with this name already exists in this option list.",
    })
    expect(actionMocks.state.inserts).toEqual([])
  })

  it("refuses safe hard delete for cross-tenant options", async () => {
    const formData = new FormData()

    formData.set("businessSlug", "randys-pizza")
    formData.set("optionId", "option-b")
    formData.set("modifierGroupId", "group-b")

    const result = await deleteModifierOption(formData)

    expect(result).toMatchObject({
      status: "error",
      message: "Modifier option could not be deleted. Please try again.",
    })
    expect(actionMocks.state.deletes).toEqual([])
  })

  it("scoped revalidations include businessSlug", async () => {
    await createModifierOption(optionFormData())

    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/modifiers/options"
    )
    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/modifiers/group-a"
    )
  })
})
