import { CheckoutPage } from "@/features/checkout/components/CheckoutPage"
import { getCheckoutOrderability } from "@/features/checkout/utils/checkout-tenant-context"
import { resolveCheckoutTenantContext } from "@/features/checkout/utils/resolve-checkout-tenant-context"
import { getBusinessPricingSettings } from "@/features/pricing-settings/queries/get-business-pricing-settings"
import { DEFAULT_BUSINESS_PRICING_SETTINGS } from "@/lib/pricing/business-pricing-settings"

export default async function CheckoutRoutePage() {
  const tenantContext = await resolveCheckoutTenantContext()
  const orderability = tenantContext
    ? getCheckoutOrderability({
        business: tenantContext.business,
        location: tenantContext.location,
      })
    : {
        ok: false as const,
        reason: "This checkout is not available right now.",
      }
  const pricingSettings = tenantContext
    ? await getBusinessPricingSettings(tenantContext.business.id)
    : DEFAULT_BUSINESS_PRICING_SETTINGS

  return (
    <CheckoutPage
      businessName={tenantContext?.business.name}
      locationName={tenantContext?.location.name}
      pricingSettings={pricingSettings}
      orderBlockedReason={orderability.ok ? null : orderability.reason}
    />
  )
}
