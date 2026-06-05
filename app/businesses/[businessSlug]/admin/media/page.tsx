import { MediaLibraryPage } from "@/features/admin-media/components/MediaLibraryPage"
import { resolveScopedMediaAdminBusiness } from "@/features/admin-media/utils/resolve-scoped-media-admin-business"

type BusinessAdminMediaRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessAdminMediaRoutePage({
  params,
}: BusinessAdminMediaRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedMediaAdminBusiness(businessSlug)

  return (
    <MediaLibraryPage
      businessContext={{ business }}
      businessSlug={business.slug}
    />
  )
}
