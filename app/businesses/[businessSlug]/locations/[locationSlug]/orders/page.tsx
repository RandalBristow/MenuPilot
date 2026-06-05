import { notFound } from "next/navigation"
import { StaffOrdersPage } from "@/features/staff-orders/components/StaffOrdersPage"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import { resolveLocationContext } from "@/features/tenant/queries/resolve-location-context"

type BusinessLocationOrdersRoutePageProps = {
  params: Promise<{
    businessSlug: string
    locationSlug: string
  }>
}

export default async function BusinessLocationOrdersRoutePage({
  params,
}: BusinessLocationOrdersRoutePageProps) {
  const { businessSlug, locationSlug } = await params
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) {
    notFound()
  }

  const location = await resolveLocationContext({
    businessId: business.id,
    locationSlug,
  })

  if (!location) {
    notFound()
  }

  return (
    <StaffOrdersPage
      businessSlug={business.slug}
      locationSlug={location.slug}
      businessName={business.name}
      locationName={location.name}
      locationStatus={location.status}
      isLocationEnabled={location.isEnabled}
      isAcceptingOrders={location.acceptingOrders}
      adminHref={`/businesses/${encodeURIComponent(business.slug)}/admin`}
    />
  )
}
