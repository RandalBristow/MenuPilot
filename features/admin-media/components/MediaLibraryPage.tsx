import { MediaLibraryClient } from "@/features/admin-media/components/MediaLibraryClient"
import { getMediaAssets } from "@/features/admin-media/queries/get-media-assets"
import type { MediaAdminBusinessContextInput } from "@/features/admin-media/utils/media-admin-business-context"

export async function MediaLibraryPage({
  businessContext,
  businessSlug,
}: {
  businessContext?: MediaAdminBusinessContextInput
  businessSlug?: string
} = {}) {
  const data = await getMediaAssets(businessContext)

  return (
    <MediaLibraryClient
      businessSlug={businessSlug}
      businessName={data.businessName}
      assets={data.assets}
    />
  )
}
