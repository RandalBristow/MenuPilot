import { describe, expect, it } from "vitest"
import {
  mapPlatformBusinessDetail,
  mapPlatformBusinessListItem,
} from "@/features/platform-admin/utils/platform-business-mappers"

describe("platform business mapping", () => {
  it("maps business list rows with location counts and first location", () => {
    const result = mapPlatformBusinessListItem({
      id: "business-1",
      name: "Pronto Demo",
      slug: "pronto-demo",
      status: "active",
      legal_name: "Pronto Demo LLC",
      primary_contact_name: "Randy",
      primary_contact_email: "randy@example.com",
      primary_phone: "555-555-1212",
      locations: [
        {
          id: "location-1",
          name: "Main Street",
          slug: "main-street",
          status: "active",
        },
        {
          id: "location-2",
          name: "Second Street",
          slug: "second-street",
          status: "setup",
        },
      ],
    })

    expect(result.locationCount).toBe(2)
    expect(result.firstLocation).toEqual({
      id: "location-1",
      name: "Main Street",
      slug: "main-street",
      status: "active",
    })
  })

  it("maps business details with locations", () => {
    const result = mapPlatformBusinessDetail({
      id: "business-1",
      name: "Pronto Demo",
      slug: "pronto-demo",
      status: "active",
      legal_name: null,
      description: null,
      primary_contact_name: null,
      primary_contact_email: null,
      primary_phone: null,
      locations: [
        {
          id: "location-1",
          name: "Main Street",
          slug: "main-street",
          status: "active",
          is_enabled: true,
          accepting_orders: true,
          pickup_enabled: true,
          delivery_enabled: false,
          address_line1: "123 Main Street",
          address_line2: null,
          city: "Mansfield",
          state: "OH",
          postal_code: "44902",
          country: "US",
          phone: "555-555-1212",
          email: "orders@example.com",
          timezone: "America/New_York",
        },
      ],
    })

    expect(result.locations).toHaveLength(1)
    expect(result.locations[0]).toMatchObject({
      name: "Main Street",
      isEnabled: true,
      acceptingOrders: true,
      pickupEnabled: true,
      deliveryEnabled: false,
      city: "Mansfield",
      timezone: "America/New_York",
    })
  })

  it("keeps null contact fields and missing locations safe", () => {
    const result = mapPlatformBusinessListItem({
      id: "business-1",
      name: "Setup Business",
      slug: "setup-business",
      status: null,
      legal_name: null,
      primary_contact_name: null,
      primary_contact_email: null,
      primary_phone: null,
      locations: null,
    })

    expect(result.status).toBe("unknown")
    expect(result.primaryContactName).toBeNull()
    expect(result.primaryContactEmail).toBeNull()
    expect(result.primaryPhone).toBeNull()
    expect(result.locationCount).toBe(0)
    expect(result.firstLocation).toBeNull()
  })
})
