export type TenantBusinessStatus = "setup" | "active" | "paused" | "archived" | string

export type TenantBusinessContext = {
  id: string
  slug: string
  name: string
  status: TenantBusinessStatus
  primaryContactName: string | null
  primaryContactEmail: string | null
  primaryPhone: string | null
  isActive: boolean
  isSetup: boolean
  isPaused: boolean
  isArchived: boolean
}

export type TenantLocationStatus = "setup" | "active" | "paused" | "archived" | string

export type TenantLocationContext = {
  id: string
  businessId: string
  slug: string
  name: string
  status: TenantLocationStatus
  isEnabled: boolean
  acceptingOrders: boolean
  pickupEnabled: boolean
  deliveryEnabled: boolean
  timezone: string
  isActive: boolean
  isSetup: boolean
}

export type RawTenantBusiness = {
  id: string
  slug: string | null
  name: string
  status: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_phone: string | null
}

export type RawTenantLocation = {
  id: string
  business_id: string
  slug: string | null
  name: string
  status: string | null
  is_enabled: boolean | null
  accepting_orders: boolean | null
  pickup_enabled: boolean | null
  delivery_enabled: boolean | null
  timezone: string | null
  created_at?: string | null
}

export type TenantContextStore = {
  findBusinessBySlug(slug: string): Promise<RawTenantBusiness | null>
  findBusinessById(id: string): Promise<RawTenantBusiness | null>
  findLocationBySlug(input: {
    businessId: string
    locationSlug: string
  }): Promise<RawTenantLocation | null>
  findLocationById(input: {
    businessId: string
    locationId: string
  }): Promise<RawTenantLocation | null>
  listLocationsForBusiness(businessId: string): Promise<RawTenantLocation[]>
}
