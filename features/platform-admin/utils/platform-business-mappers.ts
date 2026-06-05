import type {
  PlatformBusinessDetail,
  PlatformBusinessListItem,
  PlatformBusinessLocation,
  PlatformBusinessLocationSummary,
} from "@/features/platform-admin/types/platform-admin"

export type RawLocationSummary = {
  id: string
  name: string
  slug: string
  status: string | null
}

export type RawBusinessListItem = {
  id: string
  name: string
  slug: string
  status: string | null
  legal_name: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_phone: string | null
  locations: RawLocationSummary[] | RawLocationSummary | null
}

export type RawBusinessLocation = RawLocationSummary & {
  is_enabled: boolean | null
  accepting_orders: boolean | null
  pickup_enabled: boolean | null
  delivery_enabled: boolean | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  phone: string | null
  email: string | null
  timezone: string | null
}

export type RawBusinessDetail = Omit<RawBusinessListItem, "locations"> & {
  description: string | null
  locations: RawBusinessLocation[] | RawBusinessLocation | null
}

function normalizeArray<T>(value: T[] | T | null | undefined) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function mapLocationSummary(
  location: RawLocationSummary
): PlatformBusinessLocationSummary {
  return {
    id: location.id,
    name: location.name,
    slug: location.slug,
    status: location.status ?? "unknown",
  }
}

function mapBusinessLocation(
  location: RawBusinessLocation
): PlatformBusinessLocation {
  return {
    id: location.id,
    name: location.name,
    slug: location.slug,
    status: location.status ?? "unknown",
    isEnabled: location.is_enabled ?? false,
    acceptingOrders: location.accepting_orders ?? false,
    pickupEnabled: location.pickup_enabled ?? false,
    deliveryEnabled: location.delivery_enabled ?? false,
    addressLine1: location.address_line1,
    addressLine2: location.address_line2,
    city: location.city,
    state: location.state,
    postalCode: location.postal_code,
    country: location.country ?? "US",
    phone: location.phone,
    email: location.email,
    timezone: location.timezone ?? "America/New_York",
  }
}

export function mapPlatformBusinessListItem(
  business: RawBusinessListItem
): PlatformBusinessListItem {
  const locations = normalizeArray(business.locations).map(mapLocationSummary)

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    status: business.status ?? "unknown",
    legalName: business.legal_name,
    primaryContactName: business.primary_contact_name,
    primaryContactEmail: business.primary_contact_email,
    primaryPhone: business.primary_phone,
    locationCount: locations.length,
    firstLocation: locations[0] ?? null,
  }
}

export function mapPlatformBusinessDetail(
  business: RawBusinessDetail
): PlatformBusinessDetail {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    status: business.status ?? "unknown",
    legalName: business.legal_name,
    description: business.description,
    primaryContactName: business.primary_contact_name,
    primaryContactEmail: business.primary_contact_email,
    primaryPhone: business.primary_phone,
    locations: normalizeArray(business.locations).map(mapBusinessLocation),
  }
}
