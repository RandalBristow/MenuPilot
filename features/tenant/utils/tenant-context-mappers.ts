import type {
  RawTenantBusiness,
  RawTenantLocation,
  TenantBusinessContext,
  TenantLocationContext,
} from "@/features/tenant/types/tenant-context"

export function normalizeTenantSlug(value: string) {
  return value.trim().toLowerCase()
}

export function mapBusinessContext(
  business: RawTenantBusiness
): TenantBusinessContext {
  const status = business.status ?? "unknown"

  return {
    id: business.id,
    slug: business.slug ?? "",
    name: business.name,
    status,
    primaryContactName: business.primary_contact_name,
    primaryContactEmail: business.primary_contact_email,
    primaryPhone: business.primary_phone,
    isActive: status === "active",
    isSetup: status === "setup",
    isPaused: status === "paused",
    isArchived: status === "archived",
  }
}

export function mapLocationContext(
  location: RawTenantLocation
): TenantLocationContext {
  const status = location.status ?? "unknown"

  return {
    id: location.id,
    businessId: location.business_id,
    slug: location.slug ?? "",
    name: location.name,
    status,
    isEnabled: location.is_enabled ?? false,
    acceptingOrders: location.accepting_orders ?? false,
    pickupEnabled: location.pickup_enabled ?? false,
    deliveryEnabled: location.delivery_enabled ?? false,
    timezone: location.timezone ?? "America/New_York",
    isActive: status === "active",
    isSetup: status === "setup",
  }
}

export function pickDefaultLocation(
  locations: RawTenantLocation[]
): RawTenantLocation | null {
  if (locations.length === 0) return null

  const sorted = [...locations].sort((first, second) => {
    const firstActive = first.status === "active" ? 0 : 1
    const secondActive = second.status === "active" ? 0 : 1

    if (firstActive !== secondActive) return firstActive - secondActive

    const nameSort = first.name.localeCompare(second.name)
    if (nameSort !== 0) return nameSort

    const firstCreatedAt = first.created_at ?? ""
    const secondCreatedAt = second.created_at ?? ""

    if (firstCreatedAt !== secondCreatedAt) {
      return firstCreatedAt.localeCompare(secondCreatedAt)
    }

    return first.id.localeCompare(second.id)
  })

  return sorted[0]
}
