import { notFound } from "next/navigation"
import { TenantAdminShellPage } from "@/features/tenant/components/TenantAdminShellPage"
import { getBusinessPricingSettings } from "@/features/pricing-settings/queries/get-business-pricing-settings"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import { resolveDefaultLocationContext } from "@/features/tenant/queries/resolve-location-context"

type BusinessAdminRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessAdminRoutePage({
  params,
}: BusinessAdminRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) {
    notFound()
  }

  const defaultLocation = await resolveDefaultLocationContext({
    businessId: business.id,
  })
  const pricingSettings = await getBusinessPricingSettings(business.id)

  return (
    <TenantAdminShellPage
      business={business}
      defaultLocation={defaultLocation}
      pricingSettings={pricingSettings}
    />
  )
}
