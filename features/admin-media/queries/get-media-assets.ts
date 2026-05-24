import { supabaseAdmin } from "@/lib/supabase/admin"

const BUSINESS_SLUG = "pronto-demo"

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

export async function getMediaAssets() {
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, name")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (businessError || !business) {
    throw new Error("Could not load media business.")
  }

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
    businessName: business.name as string,
    assets: (data ?? []) as MediaAsset[],
  }
}
