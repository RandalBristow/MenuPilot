import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  updatePlatformBusinessStatus,
  updatePlatformLocationSettings,
} from "./update-platform-activation"

const resolverMock = vi.hoisted(() => ({
  business: {
    id: "business-a",
    slug: "business-a",
    name: "Business A",
    status: "setup",
    primaryContactName: null,
    primaryContactEmail: null,
    primaryPhone: null,
    isActive: false,
    isSetup: true,
    isPaused: false,
    isArchived: false,
  },
  location: {
    id: "location-a",
    businessId: "business-a",
    slug: "main",
    name: "Main",
    status: "setup",
    isEnabled: false,
    acceptingOrders: false,
    pickupEnabled: false,
    deliveryEnabled: false,
    timezone: "America/New_York",
    isActive: false,
    isSetup: true,
  },
  businessSlugCalls: [] as unknown[],
  businessIdCalls: [] as unknown[],
  locationSlugCalls: [] as unknown[],
  locationIdCalls: [] as unknown[],
}))

const supabaseMock = vi.hoisted(() => ({
  updates: [] as { table: string; payload: unknown }[],
  eqCalls: [] as { table: string; column: string; value: unknown }[],
  updateError: null as { message: string } | null,
}))

const revalidateMock = vi.hoisted(() => ({
  paths: [] as string[],
}))

vi.mock("@/features/tenant/queries/resolve-business-context", () => ({
  resolveBusinessContext: (input: unknown) => {
    resolverMock.businessSlugCalls.push(input)
    return Promise.resolve(resolverMock.business)
  },
  resolveBusinessContextById: (input: unknown) => {
    resolverMock.businessIdCalls.push(input)
    return Promise.resolve(resolverMock.business)
  },
}))

vi.mock("@/features/tenant/queries/resolve-location-context", () => ({
  resolveLocationContext: (input: unknown) => {
    resolverMock.locationSlugCalls.push(input)
    return Promise.resolve(resolverMock.location)
  },
  resolveLocationContextById: (input: unknown) => {
    resolverMock.locationIdCalls.push(input)
    return Promise.resolve(resolverMock.location)
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    revalidateMock.paths.push(path)
  },
}))

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: (table: string) => ({
      update(payload: unknown) {
        supabaseMock.updates.push({ table, payload })

        const query = {
          eq(column: string, value: unknown) {
            supabaseMock.eqCalls.push({ table, column, value })
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

function buildBusinessForm(overrides: Record<string, string | null> = {}) {
  const formData = new FormData()
  const values = {
    businessId: "business-a",
    businessSlug: "business-a",
    status: "active",
    ...overrides,
  }

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null) formData.set(key, value)
  })

  return formData
}

function buildLocationForm(overrides: Record<string, string | null> = {}) {
  const formData = new FormData()
  const values = {
    businessId: "business-a",
    businessSlug: "business-a",
    locationId: "location-a",
    locationSlug: "main",
    status: "active",
    isEnabled: "on",
    acceptingOrders: "on",
    pickupEnabled: "on",
    deliveryEnabled: null,
    ...overrides,
  }

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null) formData.set(key, value)
  })

  return formData
}

describe("platform activation actions", () => {
  beforeEach(() => {
    resolverMock.business = {
      id: "business-a",
      slug: "business-a",
      name: "Business A",
      status: "setup",
      primaryContactName: null,
      primaryContactEmail: null,
      primaryPhone: null,
      isActive: false,
      isSetup: true,
      isPaused: false,
      isArchived: false,
    }
    resolverMock.location = {
      id: "location-a",
      businessId: "business-a",
      slug: "main",
      name: "Main",
      status: "setup",
      isEnabled: false,
      acceptingOrders: false,
      pickupEnabled: false,
      deliveryEnabled: false,
      timezone: "America/New_York",
      isActive: false,
      isSetup: true,
    }
    resolverMock.businessSlugCalls = []
    resolverMock.businessIdCalls = []
    resolverMock.locationSlugCalls = []
    resolverMock.locationIdCalls = []
    supabaseMock.updates = []
    supabaseMock.eqCalls = []
    supabaseMock.updateError = null
    revalidateMock.paths = []
  })

  it("updates business status for a valid business", async () => {
    const result = await updatePlatformBusinessStatus(
      { ok: false, error: "" },
      buildBusinessForm()
    )

    expect(result).toEqual({ ok: true, message: "Business status updated." })
    expect(supabaseMock.updates).toEqual([
      { table: "businesses", payload: { status: "active" } },
    ])
    expect(supabaseMock.eqCalls).toContainEqual({
      table: "businesses",
      column: "id",
      value: "business-a",
    })
  })

  it("rejects a missing business status target", async () => {
    resolverMock.business = null as never

    const result = await updatePlatformBusinessStatus(
      { ok: false, error: "" },
      buildBusinessForm()
    )

    expect(result.ok).toBe(false)
    expect(result.ok ? "" : result.error).toMatch(/could not find/i)
    expect(supabaseMock.updates).toHaveLength(0)
  })

  it("updates location settings only inside the selected business", async () => {
    const result = await updatePlatformLocationSettings(
      { ok: false, error: "" },
      buildLocationForm()
    )

    expect(result).toEqual({
      ok: true,
      message: "Location ordering settings updated.",
    })
    expect(supabaseMock.updates[0]).toEqual({
      table: "locations",
      payload: {
        status: "active",
        is_enabled: true,
        accepting_orders: true,
        pickup_enabled: true,
        delivery_enabled: false,
      },
    })
    expect(supabaseMock.eqCalls).toContainEqual({
      table: "locations",
      column: "business_id",
      value: "business-a",
    })
  })

  it("fails safely when a location does not belong to the selected business", async () => {
    resolverMock.location = null as never

    const result = await updatePlatformLocationSettings(
      { ok: false, error: "" },
      buildLocationForm()
    )

    expect(result.ok).toBe(false)
    expect(result.ok ? "" : result.error).toMatch(/could not find/i)
    expect(supabaseMock.updates).toHaveLength(0)
  })

  it("forces accepting orders off when location is not orderable", async () => {
    await updatePlatformLocationSettings(
      { ok: false, error: "" },
      buildLocationForm({ status: "setup" })
    )

    expect(supabaseMock.updates[0]).toMatchObject({
      table: "locations",
      payload: {
        status: "setup",
        accepting_orders: false,
      },
    })
  })

  it("revalidates platform and business-scoped routes", async () => {
    await updatePlatformLocationSettings(
      { ok: false, error: "" },
      buildLocationForm()
    )

    expect(revalidateMock.paths).toEqual([
      "/platform/businesses",
      "/platform/businesses/business-a",
      "/businesses/business-a/admin",
      "/businesses/business-a/menu",
      "/businesses/business-a/checkout",
      "/businesses/business-a/locations/main/orders",
    ])
  })
})
