import { supabaseTenantContextStore } from "@/features/tenant/queries/tenant-context-store"
import type {
  TenantContextStore,
  TenantLocationContext,
} from "@/features/tenant/types/tenant-context"
import {
  mapLocationContext,
  normalizeTenantSlug,
  pickDefaultLocation,
} from "@/features/tenant/utils/tenant-context-mappers"

export async function resolveLocationContext(
  {
    businessId,
    locationSlug,
  }: {
    businessId: string
    locationSlug: string
  },
  store: TenantContextStore = supabaseTenantContextStore
): Promise<TenantLocationContext | null> {
  const normalizedBusinessId = businessId.trim()
  const normalizedLocationSlug = normalizeTenantSlug(locationSlug)

  if (!normalizedBusinessId || !normalizedLocationSlug) return null

  const location = await store.findLocationBySlug({
    businessId: normalizedBusinessId,
    locationSlug: normalizedLocationSlug,
  })

  return location ? mapLocationContext(location) : null
}

export async function resolveLocationContextById(
  {
    businessId,
    locationId,
  }: {
    businessId: string
    locationId: string
  },
  store: TenantContextStore = supabaseTenantContextStore
): Promise<TenantLocationContext | null> {
  const normalizedBusinessId = businessId.trim()
  const normalizedLocationId = locationId.trim()

  if (!normalizedBusinessId || !normalizedLocationId) return null

  const location = await store.findLocationById({
    businessId: normalizedBusinessId,
    locationId: normalizedLocationId,
  })

  return location ? mapLocationContext(location) : null
}

export async function resolveDefaultLocationContext(
  { businessId }: { businessId: string },
  store: TenantContextStore = supabaseTenantContextStore
): Promise<TenantLocationContext | null> {
  const normalizedBusinessId = businessId.trim()
  if (!normalizedBusinessId) return null

  const locations = await store.listLocationsForBusiness(normalizedBusinessId)
  const defaultLocation = pickDefaultLocation(locations)

  return defaultLocation ? mapLocationContext(defaultLocation) : null
}
