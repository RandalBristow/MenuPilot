import { notFound } from "next/navigation"
import { CheckoutPage } from "@/features/checkout/components/CheckoutPage"
import { getCheckoutOrderability } from "@/features/checkout/utils/checkout-tenant-context"
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

  if (!location) {
    return (
      <CheckoutPage
        businessSlug={business.slug}
        businessName={business.name}
        menuHref={menuHref}
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
      orderBlockedReason={orderability.ok ? null : orderability.reason}
    />
  )
}
