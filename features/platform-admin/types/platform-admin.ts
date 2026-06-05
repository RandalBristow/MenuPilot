export type PlatformBusinessLocationSummary = {
  id: string
  name: string
  slug: string
  status: string
}

export type PlatformBusinessListItem = {
  id: string
  name: string
  slug: string
  status: string
  legalName: string | null
  primaryContactName: string | null
  primaryContactEmail: string | null
  primaryPhone: string | null
  locationCount: number
  firstLocation: PlatformBusinessLocationSummary | null
}

export type PlatformBusinessLocation = {
  id: string
  name: string
  slug: string
  status: string
  isEnabled: boolean
  acceptingOrders: boolean
  pickupEnabled: boolean
  deliveryEnabled: boolean
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string
  phone: string | null
  email: string | null
  timezone: string
}

export type PlatformBusinessDetail = {
  id: string
  name: string
  slug: string
  status: string
  legalName: string | null
  description: string | null
  primaryContactName: string | null
  primaryContactEmail: string | null
  primaryPhone: string | null
  locations: PlatformBusinessLocation[]
}
