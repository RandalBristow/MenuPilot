import { LEGACY_MENU_BUSINESS_SLUG } from "@/features/menu/utils/legacy-menu-context"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import {
  resolveDefaultLocationContext,
  resolveLocationContext,
} from "@/features/tenant/queries/resolve-location-context"
import type { CheckoutTenantContext } from "@/features/checkout/utils/checkout-tenant-context"

const LEGACY_CHECKOUT_LOCATION_SLUG = "main-street"

export type ResolveCheckoutTenantContextInput = {
  businessSlug?: string | null
  locationSlug?: string | null
}

export async function resolveCheckoutTenantContext({
  businessSlug,
  locationSlug,
}: ResolveCheckoutTenantContextInput = {}): Promise<CheckoutTenantContext | null> {
  const isLegacyDemo = !businessSlug
  const effectiveBusinessSlug = businessSlug ?? LEGACY_MENU_BUSINESS_SLUG
  const business = await resolveBusinessContext({
    businessSlug: effectiveBusinessSlug,
  })

  if (!business) return null

  const location =
    locationSlug || isLegacyDemo
      ? await resolveLocationContext({
          businessId: business.id,
          locationSlug: locationSlug ?? LEGACY_CHECKOUT_LOCATION_SLUG,
        })
      : await resolveDefaultLocationContext({ businessId: business.id })

  if (!location) return null

  return {
    business,
    location,
    isLegacyDemo,
  }
}
