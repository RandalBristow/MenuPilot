import { describe, expect, it } from "vitest"
import {
  resolveBusinessContext,
  resolveBusinessContextById,
} from "@/features/tenant/queries/resolve-business-context"
import {
  resolveDefaultLocationContext,
  resolveLocationContext,
  resolveLocationContextById,
} from "@/features/tenant/queries/resolve-location-context"
import type {
  RawTenantBusiness,
  RawTenantLocation,
  TenantContextStore,
} from "@/features/tenant/types/tenant-context"

function createStore({
  businesses,
  locations,
}: {
  businesses: RawTenantBusiness[]
  locations: RawTenantLocation[]
}): TenantContextStore {
  return {
    async findBusinessBySlug(slug) {
      return businesses.find((business) => business.slug === slug) ?? null
    },
    async findBusinessById(id) {
      return businesses.find((business) => business.id === id) ?? null
    },
    async findLocationBySlug({ businessId, locationSlug }) {
      return (
        locations.find(
          (location) =>
            location.business_id === businessId &&
            location.slug === locationSlug
        ) ?? null
      )
    },
    async findLocationById({ businessId, locationId }) {
      return (
        locations.find(
          (location) =>
            location.business_id === businessId && location.id === locationId
        ) ?? null
      )
    },
    async listLocationsForBusiness(businessId) {
      return locations.filter((location) => location.business_id === businessId)
    },
  }
}

const businesses: RawTenantBusiness[] = [
  {
    id: "business-active",
    slug: "pronto-demo",
    name: "Pronto Demo Pizza & Carryout",
    status: "active",
    primary_contact_name: "Randy",
    primary_contact_email: "randy@example.com",
    primary_phone: "555-555-1212",
  },
  {
    id: "business-setup",
    slug: "randys-pizza",
    name: "Randy's Pizza & Pub",
    status: "setup",
    primary_contact_name: null,
    primary_contact_email: null,
    primary_phone: null,
  },
]

const locations: RawTenantLocation[] = [
  {
    id: "location-main",
    business_id: "business-active",
    slug: "main-street",
    name: "Main Street",
    status: "active",
    is_enabled: true,
    accepting_orders: true,
    pickup_enabled: true,
    delivery_enabled: false,
    timezone: "America/New_York",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "location-setup",
    business_id: "business-setup",
    slug: "randys-main",
    name: "Randy's Main",
    status: "setup",
    is_enabled: false,
    accepting_orders: false,
    pickup_enabled: false,
    delivery_enabled: false,
    timezone: "America/New_York",
    created_at: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "location-active-late",
    business_id: "business-setup",
    slug: "z-active",
    name: "Z Active",
    status: "active",
    is_enabled: true,
    accepting_orders: false,
    pickup_enabled: true,
    delivery_enabled: false,
    timezone: null,
    created_at: "2026-01-03T00:00:00.000Z",
  },
]

describe("tenant context resolvers", () => {
  const store = createStore({ businesses, locations })

  it("resolves an existing business by normalized slug", async () => {
    const result = await resolveBusinessContext(
      { businessSlug: "  Pronto-Demo  " },
      store
    )

    expect(result).toMatchObject({
      id: "business-active",
      slug: "pronto-demo",
      name: "Pronto Demo Pizza & Carryout",
      isActive: true,
      isSetup: false,
      isPaused: false,
      isArchived: false,
      primaryContactName: "Randy",
    })
  })

  it("returns setup flags for setup businesses", async () => {
    const result = await resolveBusinessContextById(
      { businessId: "business-setup" },
      store
    )

    expect(result).toMatchObject({
      slug: "randys-pizza",
      status: "setup",
      isActive: false,
      isSetup: true,
    })
  })

  it("returns null for an unknown business slug", async () => {
    await expect(
      resolveBusinessContext({ businessSlug: "missing-business" }, store)
    ).resolves.toBeNull()
  })

  it("resolves a location by slug within the supplied business", async () => {
    const result = await resolveLocationContext(
      {
        businessId: "business-active",
        locationSlug: "MAIN-STREET",
      },
      store
    )

    expect(result).toMatchObject({
      id: "location-main",
      businessId: "business-active",
      slug: "main-street",
      isActive: true,
      isSetup: false,
      isEnabled: true,
      acceptingOrders: true,
      pickupEnabled: true,
      deliveryEnabled: false,
      timezone: "America/New_York",
    })
  })

  it("does not resolve a location from another business", async () => {
    await expect(
      resolveLocationContext(
        {
          businessId: "business-setup",
          locationSlug: "main-street",
        },
        store
      )
    ).resolves.toBeNull()
  })

  it("resolves a location by id within the supplied business", async () => {
    const result = await resolveLocationContextById(
      {
        businessId: "business-setup",
        locationId: "location-setup",
      },
      store
    )

    expect(result).toMatchObject({
      id: "location-setup",
      status: "setup",
      isActive: false,
      isSetup: true,
      isEnabled: false,
      acceptingOrders: false,
    })
  })

  it("resolves default location deterministically with active locations first", async () => {
    const result = await resolveDefaultLocationContext(
      { businessId: "business-setup" },
      store
    )

    expect(result).toMatchObject({
      id: "location-active-late",
      status: "active",
      timezone: "America/New_York",
    })
  })
})
