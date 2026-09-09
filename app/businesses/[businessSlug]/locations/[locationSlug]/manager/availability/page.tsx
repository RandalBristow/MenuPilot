import { notFound } from "next/navigation"
import { ManagerAvailabilityPage } from "@/features/manager/components/ManagerAvailabilityPage"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import { resolveLocationContext } from "@/features/tenant/queries/resolve-location-context"

export default async function ManagerAvailabilityRoutePage({
  params,
}: {
  params: Promise<{ businessSlug: string; locationSlug: string }>
}) {
  const { businessSlug, locationSlug } = await params
  const business = await resolveBusinessContext({ businessSlug })
  if (!business) notFound()
  const location = await resolveLocationContext({ businessId: business.id, locationSlug })
  if (!location) notFound()

  return (
    <ManagerAvailabilityPage
      businessId={business.id}
      locationId={location.id}
      businessName={business.name}
      locationName={location.name}
      businessSlug={business.slug}
      locationSlug={location.slug}
    />
  )
}
