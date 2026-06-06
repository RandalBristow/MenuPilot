import { notFound } from "next/navigation"
import { PlatformBusinessDetailPage } from "@/features/platform-admin/components/platform-admin-ui"
import { getPlatformBusinessDetail } from "@/features/platform-admin/queries/get-platform-businesses"
import { getBusinessPricingSettings } from "@/features/pricing-settings/queries/get-business-pricing-settings"

type PlatformBusinessDetailRoutePageProps = {
  params: Promise<{
    businessId: string
  }>
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export default async function PlatformBusinessDetailRoutePage({
  params,
}: PlatformBusinessDetailRoutePageProps) {
  const { businessId } = await params

  if (!isUuid(businessId)) {
    notFound()
  }

  const business = await getPlatformBusinessDetail(businessId)

  if (!business) {
    notFound()
  }

  const pricingSettings = await getBusinessPricingSettings(business.id)

  return (
    <PlatformBusinessDetailPage
      business={business}
      pricingSettings={pricingSettings}
    />
  )
}
