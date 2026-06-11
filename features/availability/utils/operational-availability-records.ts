import {
  resolveOperationalAvailability,
} from "@/features/availability/utils/resolve-operational-availability"
import type {
  OperationalAvailabilityOverride,
  OperationalAvailabilityResolution,
} from "@/features/availability/types/operational-availability"

export type RawOperationalAvailabilityRecord = {
  id?: string
  product_id?: string | null
  modifier_option_id?: string | null
  location_id?: string | null
  is_86d: boolean
  reason: string | null
  expires_at: string | null
}

export function mapOperationalAvailabilityRecord(
  record: RawOperationalAvailabilityRecord
): OperationalAvailabilityOverride {
  return {
    id: record.id,
    locationId: record.location_id ?? null,
    is86d: record.is_86d,
    reason: record.reason,
    expiresAt: record.expires_at,
  }
}

export function groupProductOperationalAvailabilityRecords(
  records: RawOperationalAvailabilityRecord[] | null | undefined
) {
  const recordsByProductId = new Map<string, OperationalAvailabilityOverride[]>()

  for (const record of records ?? []) {
    if (!record.product_id) continue

    const existing = recordsByProductId.get(record.product_id) ?? []
    recordsByProductId.set(record.product_id, [
      ...existing,
      mapOperationalAvailabilityRecord(record),
    ])
  }

  return recordsByProductId
}

export function groupModifierOptionOperationalAvailabilityRecords(
  records: RawOperationalAvailabilityRecord[] | null | undefined
) {
  const recordsByOptionId = new Map<string, OperationalAvailabilityOverride[]>()

  for (const record of records ?? []) {
    if (!record.modifier_option_id) continue

    const existing = recordsByOptionId.get(record.modifier_option_id) ?? []
    recordsByOptionId.set(record.modifier_option_id, [
      ...existing,
      mapOperationalAvailabilityRecord(record),
    ])
  }

  return recordsByOptionId
}

export function resolveOperationalAvailabilityForRecords({
  isPermanentlyEnabled,
  records,
  locationId = null,
  currentTime = new Date(),
}: {
  isPermanentlyEnabled: boolean
  records?: OperationalAvailabilityOverride[] | null
  locationId?: string | null
  currentTime?: Date
}): OperationalAvailabilityResolution {
  return resolveOperationalAvailability({
    isPermanentlyEnabled,
    overrides: records ?? [],
    locationId,
    currentTime,
  })
}
