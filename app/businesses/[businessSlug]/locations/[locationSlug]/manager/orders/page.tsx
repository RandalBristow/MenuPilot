import { notFound } from "next/navigation"
import { StaffOrdersPage } from "@/features/staff-orders/components/StaffOrdersPage"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import { resolveLocationContext } from "@/features/tenant/queries/resolve-location-context"

export default async function ManagerOrdersRoutePage({
  params,
}: {
  params: Promise<{ businessSlug: string; locationSlug: string }>
}) {
  const { businessSlug, locationSlug } = await params
  const business = await resolveBusinessContext({ businessSlug })
  if (!business) notFound()
  const location = await resolveLocationContext({ businessId: business.id, locationSlug })
  if (!location) notFound()
  const managerHref = `/businesses/${encodeURIComponent(business.slug)}/locations/${encodeURIComponent(location.slug)}/manager`

  return (
    <StaffOrdersPage
      businessSlug={business.slug}
      locationSlug={location.slug}
      businessName={business.name}
      locationName={location.name}
      locationStatus={location.status}
      isAcceptingOrders={location.acceptingOrders}
      adminHref={managerHref}
      backLabel="Back to manager dashboard"
      pageTitle={`${location.name} Orders`}
    />
  )
}
