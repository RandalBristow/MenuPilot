import { beforeEach, describe, expect, it, vi } from "vitest"
import { updateOrderStatus } from "./update-order-status"
import type { StaffOrderScope } from "@/features/staff-orders/queries/get-orders"

const scopeMock = vi.hoisted(() => ({
  calls: [] as unknown[],
  scope: {
    isLegacyDemo: false,
    business: {
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
    },
    location: {
      id: "location-a",
      businessId: "business-a",
      slug: "main",
      name: "Main",
      status: "active",
      isEnabled: true,
      acceptingOrders: true,
      pickupEnabled: true,
      deliveryEnabled: false,
      timezone: "America/New_York",
      isActive: true,
      isSetup: false,
    },
  } as StaffOrderScope | null,
}))

const supabaseMock = vi.hoisted(() => ({
  selectEqCalls: [] as { column: string; value: unknown }[],
  updateEqCalls: [] as { column: string; value: unknown }[],
  updates: [] as unknown[],
  order: { order_status: "new" as string } as { order_status: string } | null,
  orderError: null as { message: string } | null,
  updateError: null as { message: string } | null,
}))

const revalidateMock = vi.hoisted(() => ({
  paths: [] as string[],
}))

vi.mock("@/features/staff-orders/queries/get-orders", () => ({
  getStaffOrderScope: (input: unknown) => {
    scopeMock.calls.push(input)
    return Promise.resolve(scopeMock.scope)
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    revalidateMock.paths.push(path)
  },
}))

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: () => ({
      select() {
        const query = {
          eq(column: string, value: unknown) {
            supabaseMock.selectEqCalls.push({ column, value })
            return query
          },
          single() {
            return Promise.resolve({
              data: supabaseMock.order,
              error: supabaseMock.orderError,
            })
          },
        }

        return query
      },
      update(payload: unknown) {
        supabaseMock.updates.push(payload)

        const query = {
          eq(column: string, value: unknown) {
            supabaseMock.updateEqCalls.push({ column, value })
            return query
          },
          then(
            resolve: (result: { error: { message: string } | null }) => void
          ) {
            resolve({ error: supabaseMock.updateError })
          },
        }

        return query
      },
    }),
  },
}))

function buildForm(overrides: Record<string, string | null> = {}) {
  const formData = new FormData()
  const values = {
    orderId: "order-a",
    status: "accepted",
    businessSlug: "business-a",
    locationSlug: "main",
    ...overrides,
  }

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null) {
      formData.set(key, value)
    }
  })

  return formData
}

describe("updateOrderStatus tenant scope", () => {
  beforeEach(() => {
    scopeMock.calls = []
    scopeMock.scope = {
      business: {
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
      },
      location: {
        id: "location-a",
        businessId: "business-a",
        slug: "main",
        name: "Main",
        status: "active",
        isEnabled: true,
        acceptingOrders: true,
        pickupEnabled: true,
        deliveryEnabled: false,
        timezone: "America/New_York",
        isActive: true,
        isSetup: false,
      },
      isLegacyDemo: false,
    }
    supabaseMock.selectEqCalls = []
    supabaseMock.updateEqCalls = []
    supabaseMock.updates = []
    supabaseMock.order = { order_status: "new" }
    supabaseMock.orderError = null
    supabaseMock.updateError = null
    revalidateMock.paths = []
  })

  it("resolves scoped slugs server-side before updating", async () => {
    await updateOrderStatus(buildForm())

    expect(scopeMock.calls[0]).toEqual({
      businessSlug: "business-a",
      locationSlug: "main",
    })
  })

  it("verifies the order belongs to the selected business and location", async () => {
    await updateOrderStatus(buildForm())

    expect(supabaseMock.selectEqCalls).toEqual([
      { column: "id", value: "order-a" },
      { column: "business_id", value: "business-a" },
      { column: "location_id", value: "location-a" },
    ])
    expect(supabaseMock.updateEqCalls).toEqual([
      { column: "id", value: "order-a" },
      { column: "business_id", value: "business-a" },
      { column: "location_id", value: "location-a" },
    ])
  })

  it("fails safely when the selected scope cannot see the order", async () => {
    supabaseMock.order = null

    await expect(updateOrderStatus(buildForm())).rejects.toThrow(
      "Could not load order."
    )
    expect(supabaseMock.updates).toHaveLength(0)
  })

  it("fails safely for cross-tenant status updates", async () => {
    scopeMock.scope = {
      ...scopeMock.scope!,
      business: {
        ...scopeMock.scope!.business,
        id: "business-b",
        slug: "business-b",
      },
    }
    supabaseMock.order = null

    await expect(updateOrderStatus(buildForm())).rejects.toThrow(
      "Could not load order."
    )
    expect(supabaseMock.selectEqCalls).toContainEqual({
      column: "business_id",
      value: "business-b",
    })
    expect(supabaseMock.updates).toHaveLength(0)
  })

  it("fails safely for cross-location status updates", async () => {
    scopeMock.scope = {
      ...scopeMock.scope!,
      location: {
        ...scopeMock.scope!.location,
        id: "location-b",
        slug: "side",
      },
    }
    supabaseMock.order = null

    await expect(updateOrderStatus(buildForm())).rejects.toThrow(
      "Could not load order."
    )
    expect(supabaseMock.selectEqCalls).toContainEqual({
      column: "location_id",
      value: "location-b",
    })
    expect(supabaseMock.updates).toHaveLength(0)
  })

  it("uses scoped revalidation for scoped staff order updates", async () => {
    await updateOrderStatus(buildForm())

    expect(revalidateMock.paths).toEqual([
      "/businesses/business-a/locations/main/orders",
    ])
  })

  it("keeps legacy staff updates on the demo fallback", async () => {
    await updateOrderStatus(
      buildForm({ businessSlug: null, locationSlug: null })
    )

    expect(scopeMock.calls[0]).toEqual({
      businessSlug: null,
      locationSlug: null,
    })
    expect(revalidateMock.paths).toEqual(["/staff/orders"])
  })
})
