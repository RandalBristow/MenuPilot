import type {
  OperationalAvailabilityOverride,
  OperationalAvailabilityResolution,
} from "@/features/availability/types/operational-availability"

type ResolveOperationalAvailabilityInput = {
  isPermanentlyEnabled: boolean
  overrides?: OperationalAvailabilityOverride[] | null
  locationId?: string | null
  currentTime?: Date
}

export function isOperationalAvailabilityOverrideActive({
  override,
  currentTime = new Date(),
}: {
  override: OperationalAvailabilityOverride
  currentTime?: Date
}) {
  if (!override.expiresAt) return true

  return new Date(override.expiresAt).getTime() > currentTime.getTime()
}

function pickActiveOverride({
  overrides,
  locationId,
  currentTime,
}: {
  overrides: OperationalAvailabilityOverride[]
  locationId: string | null
  currentTime: Date
}) {
  const activeOverrides = overrides.filter((override) =>
    isOperationalAvailabilityOverrideActive({ override, currentTime })
  )
  const locationOverride = locationId
    ? activeOverrides.find((override) => override.locationId === locationId)
    : null

  return (
    locationOverride ??
    activeOverrides.find((override) => override.locationId === null) ??
    null
  )
}

export function resolveOperationalAvailability({
  isPermanentlyEnabled,
  overrides = [],
  locationId = null,
  currentTime = new Date(),
}: ResolveOperationalAvailabilityInput): OperationalAvailabilityResolution {
  const activeOverride = pickActiveOverride({
    overrides: overrides ?? [],
    locationId,
    currentTime,
  })
  const is86d = Boolean(activeOverride?.is86d)

  return {
    isPermanentlyEnabled,
    isOperationallyAvailable: isPermanentlyEnabled && !is86d,
    is86d,
    reason: is86d ? activeOverride?.reason ?? null : null,
    expiresAt: is86d ? activeOverride?.expiresAt ?? null : null,
    activeOverride,
  }
}
