import { CheckoutPage } from "@/features/checkout/components/CheckoutPage"
import { getCheckoutOrderability } from "@/features/checkout/utils/checkout-tenant-context"
import { resolveCheckoutTenantContext } from "@/features/checkout/utils/resolve-checkout-tenant-context"

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

  return (
    <CheckoutPage
      businessName={tenantContext?.business.name}
      locationName={tenantContext?.location.name}
      orderBlockedReason={orderability.ok ? null : orderability.reason}
    />
  )
}
