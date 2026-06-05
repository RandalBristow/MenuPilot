import { describe, expect, it, vi } from "vitest"
import {
  buildPlatformBusinessCreatePayload,
  createPlatformBusinessWithLocationRecord,
  normalizePlatformSlug,
  type PlatformBusinessCreateRepository,
} from "@/features/platform-admin/utils/create-platform-business"

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  const values = {
    businessName: "The Corner Cafe",
    businessSlug: "the-corner-cafe",
    legalName: "The Corner Cafe LLC",
    description: "A new restaurant.",
    primaryContactName: "Randy",
    primaryContactEmail: "randy@example.com",
    primaryPhone: "555-555-1212",
    locationName: "Main Street",
    locationSlug: "main-street",
    addressLine1: "123 Main Street",
    addressLine2: "",
    city: "Mansfield",
    state: "OH",
    postalCode: "44902",
    locationPhone: "555-555-1212",
    locationEmail: "orders@example.com",
    timezone: "America/New_York",
    ...overrides,
  }

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value)
  })

  return formData
}

function createRepository(
  overrides: Partial<PlatformBusinessCreateRepository> = {}
): PlatformBusinessCreateRepository {
  return {
    findBusinessBySlug: vi.fn().mockResolvedValue(null),
    insertBusiness: vi.fn().mockResolvedValue({ id: "business-1" }),
    insertLocation: vi.fn().mockResolvedValue(undefined),
    deleteBusiness: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe("platform business creation", () => {
  it("normalizes slugs", () => {
    expect(normalizePlatformSlug(" The Corner Cafe!! ")).toBe(
      "the-corner-cafe"
    )
  })

  it("validates required business name", () => {
    expect(() =>
      buildPlatformBusinessCreatePayload(createFormData({ businessName: "" }))
    ).toThrow("Business name is required.")
  })

  it("validates required business slug", () => {
    expect(() =>
      buildPlatformBusinessCreatePayload(createFormData({ businessSlug: "" }))
    ).toThrow("Business slug is required.")
  })

  it("returns a friendly error for duplicate business slugs", async () => {
    const repository = createRepository({
      findBusinessBySlug: vi.fn().mockResolvedValue({ id: "existing" }),
    })

    const result = await createPlatformBusinessWithLocationRecord(
      repository,
      createFormData()
    )

    expect(result).toEqual({
      ok: false,
      error: "A business with that slug already exists.",
    })
  })

  it("validates required location name", () => {
    expect(() =>
      buildPlatformBusinessCreatePayload(createFormData({ locationName: "" }))
    ).toThrow("Location name is required.")
  })

  it("validates required location slug", () => {
    expect(() =>
      buildPlatformBusinessCreatePayload(createFormData({ locationSlug: "" }))
    ).toThrow("Location slug is required.")
  })

  it("inserts business with setup status", async () => {
    const repository = createRepository()

    await createPlatformBusinessWithLocationRecord(repository, createFormData())

    expect(repository.insertBusiness).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "The Corner Cafe",
        slug: "the-corner-cafe",
        status: "setup",
      })
    )
  })

  it("inserts location with setup status and ordering disabled", async () => {
    const repository = createRepository()

    await createPlatformBusinessWithLocationRecord(repository, createFormData())

    expect(repository.insertLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "business-1",
        name: "Main Street",
        slug: "main-street",
        status: "setup",
        is_enabled: false,
        accepting_orders: false,
        pickup_enabled: false,
        delivery_enabled: false,
      })
    )
  })

  it("does not silently succeed when location insert fails", async () => {
    const repository = createRepository({
      insertLocation: vi.fn().mockRejectedValue(new Error("Location failed.")),
    })

    const result = await createPlatformBusinessWithLocationRecord(
      repository,
      createFormData()
    )

    expect(result).toEqual({
      ok: false,
      error: "Location failed.",
    })
    expect(repository.deleteBusiness).toHaveBeenCalledWith("business-1")
  })

  it("returns the created business id for detail navigation", async () => {
    const repository = createRepository()

    const result = await createPlatformBusinessWithLocationRecord(
      repository,
      createFormData()
    )

    expect(result).toEqual({
      ok: true,
      businessId: "business-1",
    })
  })
})
