import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  type MediaAdminBusinessContextInput,
  resolveMediaAdminBusinessContext,
} from "@/features/admin-media/utils/media-admin-business-context"

export type MediaAsset = {
  id: string
  public_url: string | null
  file_name: string | null
  alt_text: string | null
  caption: string | null
  folder: string | null
  tags: string[]
  is_archived: boolean
  created_at: string
}

export async function getMediaAssets(
  businessContext: MediaAdminBusinessContextInput = {}
) {
  const business = await resolveMediaAdminBusinessContext(businessContext)
  const { data, error } = await supabaseAdmin
    .from("media_assets")
    .select(
      `
      id,
      public_url,
      file_name,
      alt_text,
      caption,
      folder,
      tags,
      is_archived,
      created_at
    `
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Could not load media assets: ${error.message}`)
  }

  return {
    businessName: business.name,
    assets: (data ?? []) as MediaAsset[],
  }
}
