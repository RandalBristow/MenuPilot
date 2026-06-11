import { loadActivePublicSpecials } from "@/features/specials/queries/load-active-public-specials"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import { supabaseTenantContextStore } from "@/features/tenant/queries/tenant-context-store"
import { pickDefaultLocation } from "@/features/tenant/utils/tenant-context-mappers"

export async function getPublicSpecialsPageData(businessSlug: string) {
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) return null

  const locations = await supabaseTenantContextStore.listLocationsForBusiness(
    business.id
  )
  const defaultLocation = pickDefaultLocation(locations)
  const activeSpecials = await loadActivePublicSpecials({
    businessId: business.id,
    currentTime: new Date(),
    timeZone: defaultLocation?.timezone ?? "America/New_York",
  })

  return {
    business,
    activeSpecials,
  }
}
