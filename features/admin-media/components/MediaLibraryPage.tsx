import { MediaLibraryClient } from "@/features/admin-media/components/MediaLibraryClient"
import { getMediaAssets } from "@/features/admin-media/queries/get-media-assets"

export async function MediaLibraryPage() {
  const data = await getMediaAssets()

  return (
    <MediaLibraryClient
      businessName={data.businessName}
      assets={data.assets}
    />
  )
}
