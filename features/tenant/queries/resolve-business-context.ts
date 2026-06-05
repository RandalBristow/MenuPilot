import { supabaseTenantContextStore } from "@/features/tenant/queries/tenant-context-store"
import type {
  TenantBusinessContext,
  TenantContextStore,
} from "@/features/tenant/types/tenant-context"
import {
  mapBusinessContext,
  normalizeTenantSlug,
} from "@/features/tenant/utils/tenant-context-mappers"

export async function resolveBusinessContext(
  { businessSlug }: { businessSlug: string },
  store: TenantContextStore = supabaseTenantContextStore
): Promise<TenantBusinessContext | null> {
  const slug = normalizeTenantSlug(businessSlug)
  if (!slug) return null

  const business = await store.findBusinessBySlug(slug)

  return business ? mapBusinessContext(business) : null
}

export async function resolveBusinessContextById(
  { businessId }: { businessId: string },
  store: TenantContextStore = supabaseTenantContextStore
): Promise<TenantBusinessContext | null> {
  const id = businessId.trim()
  if (!id) return null

  const business = await store.findBusinessById(id)

  return business ? mapBusinessContext(business) : null
}
