import { notFound } from "next/navigation"
import { PublicSpecialsPageClient } from "@/features/specials/components/PublicSpecialsPageClient"
import { getPublicSpecialsPageData } from "@/features/specials/queries/get-public-specials-page-data"

type BusinessSpecialsRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessSpecialsRoutePage({
  params,
}: BusinessSpecialsRoutePageProps) {
  const { businessSlug } = await params
  const data = await getPublicSpecialsPageData(businessSlug)

  if (!data) {
    notFound()
  }

  return (
    <PublicSpecialsPageClient
      businessName={data.business.name}
      businessSlug={data.business.slug}
      businessStatus={data.business.status}
      activeSpecials={data.activeSpecials}
    />
  )
}
