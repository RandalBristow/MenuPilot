import { beforeEach, describe, expect, it, vi } from "vitest"
import { saveMediaAsset } from "@/features/admin-media/actions/save-media-asset"
import { getMediaAssets } from "@/features/admin-media/queries/get-media-assets"

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
    uploads: [] as Array<{
      bucket: string
      path: string
      options: { contentType?: string; upsert?: boolean }
    }>,
    rowsByTable: {} as Record<string, Row[]>,
  }

  function reset() {
    state.revalidated = []
    state.inserts = []
    state.updates = []
    state.uploads = []
    state.rowsByTable = {
      businesses: [
        { id: "business-demo", slug: "pronto-demo", name: "Pronto Demo" },
        { id: "business-a", slug: "randys-pizza", name: "Randy's Pizza" },
        { id: "business-b", slug: "other-business", name: "Other Business" },
      ],
      media_assets: [
        {
          id: "media-a",
          business_id: "business-a",
          public_url: "https://cdn.example.com/a.jpg",
          file_name: "Randy Pizza",
          alt_text: "Randy Pizza",
          caption: null,
          folder: null,
          tags: ["pizza"],
          is_archived: false,
          created_at: "2026-06-01T00:00:00Z",
        },
        {
          id: "media-b",
          business_id: "business-b",
          public_url: "https://cdn.example.com/b.jpg",
          file_name: "Other Pizza",
          alt_text: "Other Pizza",
          caption: null,
          folder: null,
          tags: ["wings"],
          is_archived: false,
          created_at: "2026-06-02T00:00:00Z",
        },
      ],
    }
  }

  function matches(row: Row, filters: Filter[]) {
    return filters.every((filter) => row[filter.column] === filter.value)
  }

  class FakeQueryBuilder {
    private filters: Filter[] = []
    private selectedOrder: { column: string; ascending: boolean } | null = null
    private operation:
      | { type: "insert"; records: Row[] }
      | { type: "update"; payload: Row }
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

    single() {
      const row = this.resolveRows()[0] ?? null

      return Promise.resolve({
        data: row,
        error: row ? null : { message: "not found" },
      })
    }

    maybeSingle() {
      const row = this.resolveRows()[0] ?? null

      return Promise.resolve({
        data: row,
        error: null,
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
          const firstValue = String(first[column] ?? "")
          const secondValue = String(second[column] ?? "")
          const comparison = firstValue.localeCompare(secondValue)

          return ascending ? comparison : -comparison
        })
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
      storage: {
        from: (bucket: string) => ({
          upload: (
            path: string,
            _body: unknown,
            options: { contentType?: string; upsert?: boolean }
          ) => {
            state.uploads.push({ bucket, path, options })

            return Promise.resolve({ error: null })
          },
          getPublicUrl: (path: string) => ({
            data: {
              publicUrl: `https://storage.example.com/${bucket}/${path}`,
            },
          }),
        }),
      },
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

function mediaFormData({
  businessSlug = "randys-pizza",
  mediaAssetId,
  sourceType = "upload",
}: {
  businessSlug?: string
  mediaAssetId?: string
  sourceType?: "keep" | "upload" | "url"
} = {}) {
  const formData = new FormData()

  if (businessSlug) formData.set("businessSlug", businessSlug)
  if (mediaAssetId) formData.set("mediaAssetId", mediaAssetId)
  formData.set("sourceType", sourceType)
  formData.set("name", "Deluxe Pizza")
  formData.set("altText", "Deluxe Pizza")
  formData.set("tags", "pizza, deluxe")

  if (sourceType === "upload") {
    formData.set(
      "imageFile",
      new File(["image-bytes"], "Deluxe Pizza.jpg", { type: "image/jpeg" })
    )
  }

  if (sourceType === "url") {
    formData.set("importUrl", "https://example.com/imported.png")
  }

  return formData
}

describe("tenant-aware media library", () => {
  beforeEach(() => {
    actionMocks.reset()
    vi.stubGlobal("crypto", {
      randomUUID: () => "uuid-1",
    })
  })

  it("reads media assets for the selected business only", async () => {
    const result = await getMediaAssets({ businessSlug: "randys-pizza" })

    expect(result.businessName).toBe("Randy's Pizza")
    expect(result.assets.map((asset) => asset.id)).toEqual(["media-a"])
  })

  it("upload writes selected business_id and selected business storage path", async () => {
    const result = await saveMediaAsset(mediaFormData())

    expect(result).toEqual({ ok: true })
    expect(actionMocks.state.uploads[0]).toMatchObject({
      bucket: "menu-media",
      path: "business-a/library/uuid-1-deluxe-pizza.jpg",
      options: { contentType: "image/jpeg", upsert: false },
    })
    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "media_assets",
      records: [
        {
          business_id: "business-a",
          storage_path: "business-a/library/uuid-1-deluxe-pizza.jpg",
        },
      ],
    })
  })

  it("import-from-url writes selected business_id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: {
              "content-type": "image/png",
              "content-length": "3",
            },
          })
        )
      )
    )

    const result = await saveMediaAsset(mediaFormData({ sourceType: "url" }))

    expect(result).toEqual({ ok: true })
    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "media_assets",
      records: [{ business_id: "business-a" }],
    })
    expect(actionMocks.state.uploads[0].path).toBe(
      "business-a/library/uuid-1-imported.png"
    )
  })

  it("refuses to update a media asset from another business", async () => {
    await expect(
      saveMediaAsset(
        mediaFormData({
          mediaAssetId: "media-b",
          sourceType: "keep",
        })
      )
    ).rejects.toThrow("Selected media asset could not be found.")
  })

  it("scoped revalidation paths include businessSlug", async () => {
    await saveMediaAsset(mediaFormData())

    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/media"
    )
    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products"
    )
    expect(actionMocks.state.revalidated).toContain(
      "/businesses/randys-pizza/admin/products/list"
    )
  })

  it("keeps legacy demo fallback when businessSlug is omitted", async () => {
    const result = await saveMediaAsset(mediaFormData({ businessSlug: "" }))

    expect(result).toEqual({ ok: true })
    expect(actionMocks.state.inserts[0]).toMatchObject({
      table: "media_assets",
      records: [{ business_id: "business-demo" }],
    })
    expect(actionMocks.state.revalidated).toContain("/admin/media")
  })
})
