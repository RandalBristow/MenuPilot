export type OperationalAvailabilityOverride = {
  id?: string
  locationId: string | null
  is86d: boolean
  reason: string | null
  expiresAt: string | null
}

export type OperationalAvailabilityResolution = {
  isPermanentlyEnabled: boolean
  isOperationallyAvailable: boolean
  is86d: boolean
  reason: string | null
  expiresAt: string | null
  activeOverride: OperationalAvailabilityOverride | null
}
