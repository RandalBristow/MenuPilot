import { notFound } from "next/navigation"
import { CheckoutPage } from "@/features/checkout/components/CheckoutPage"
import { getCheckoutOrderability } from "@/features/checkout/utils/checkout-tenant-context"
import { getBusinessPricingSettings } from "@/features/pricing-settings/queries/get-business-pricing-settings"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import { resolveDefaultLocationContext } from "@/features/tenant/queries/resolve-location-context"

type BusinessCheckoutRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessCheckoutRoutePage({
  params,
}: BusinessCheckoutRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) {
    notFound()
  }

  const location = await resolveDefaultLocationContext({ businessId: business.id })
  const menuHref = `/businesses/${encodeURIComponent(business.slug)}/menu`
  const pricingSettings = await getBusinessPricingSettings(business.id)

  if (!location) {
    return (
      <CheckoutPage
        businessSlug={business.slug}
        businessName={business.name}
        menuHref={menuHref}
        pricingSettings={pricingSettings}
        orderBlockedReason="Checkout is not available because this business does not have a location yet."
      />
    )
  }

  const orderability = getCheckoutOrderability({
    business,
    location,
  })

  return (
    <CheckoutPage
      businessSlug={business.slug}
      businessName={business.name}
      locationName={location.name}
      menuHref={menuHref}
      pricingSettings={pricingSettings}
      orderBlockedReason={orderability.ok ? null : orderability.reason}
    />
  )
}
