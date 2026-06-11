import { describe, expect, it } from "vitest"
import { resolveOperationalAvailability } from "./resolve-operational-availability"

const now = new Date("2026-06-10T16:00:00.000Z")

describe("resolveOperationalAvailability", () => {
  it("keeps permanently disabled products unavailable", () => {
    const result = resolveOperationalAvailability({
      isPermanentlyEnabled: false,
      currentTime: now,
    })

    expect(result).toMatchObject({
      isPermanentlyEnabled: false,
      isOperationallyAvailable: false,
      is86d: false,
    })
  })

  it("marks active product 86 overrides unavailable", () => {
    const result = resolveOperationalAvailability({
      isPermanentlyEnabled: true,
      currentTime: now,
      overrides: [
        {
          locationId: null,
          is86d: true,
          reason: "Sold out",
          expiresAt: "2026-06-10T18:00:00.000Z",
        },
      ],
    })

    expect(result).toMatchObject({
      isOperationallyAvailable: false,
      is86d: true,
      reason: "Sold out",
    })
  })

  it("ignores expired product 86 overrides", () => {
    const result = resolveOperationalAvailability({
      isPermanentlyEnabled: true,
      currentTime: now,
      overrides: [
        {
          locationId: null,
          is86d: true,
          reason: "Sold out",
          expiresAt: "2026-06-10T15:59:59.000Z",
        },
      ],
    })

    expect(result).toMatchObject({
      isOperationallyAvailable: true,
      is86d: false,
      reason: null,
    })
  })

  it("marks active modifier option 86 overrides unavailable", () => {
    const result = resolveOperationalAvailability({
      isPermanentlyEnabled: true,
      currentTime: now,
      overrides: [
        {
          locationId: null,
          is86d: true,
          reason: "Out for the shift",
          expiresAt: null,
        },
      ],
    })

    expect(result.isOperationallyAvailable).toBe(false)
    expect(result.reason).toBe("Out for the shift")
  })

  it("ignores expired modifier option 86 overrides", () => {
    const result = resolveOperationalAvailability({
      isPermanentlyEnabled: true,
      currentTime: now,
      overrides: [
        {
          locationId: null,
          is86d: true,
          reason: "Out yesterday",
          expiresAt: "2026-06-09T16:00:00.000Z",
        },
      ],
    })

    expect(result.isOperationallyAvailable).toBe(true)
  })

  it("applies business-wide overrides when no location override exists", () => {
    const result = resolveOperationalAvailability({
      isPermanentlyEnabled: true,
      locationId: "location-a",
      currentTime: now,
      overrides: [
        {
          locationId: null,
          is86d: true,
          reason: "Business-wide",
          expiresAt: null,
        },
      ],
    })

    expect(result.is86d).toBe(true)
    expect(result.reason).toBe("Business-wide")
  })

  it("lets location-specific overrides take precedence over business-wide overrides", () => {
    const result = resolveOperationalAvailability({
      isPermanentlyEnabled: true,
      locationId: "location-a",
      currentTime: now,
      overrides: [
        {
          locationId: null,
          is86d: true,
          reason: "Business-wide",
          expiresAt: null,
        },
        {
          locationId: "location-a",
          is86d: false,
          reason: null,
          expiresAt: null,
        },
      ],
    })

    expect(result.isOperationallyAvailable).toBe(true)
    expect(result.activeOverride?.locationId).toBe("location-a")
  })
})
