import { supabaseAdmin } from "@/lib/supabase/admin"
import { getMediaAdminHref } from "@/features/admin-media/utils/media-admin-routes"

const DEMO_BUSINESS_SLUG = "pronto-demo"

export type MediaAdminActionContext = {
  businessId: string
  businessSlug: string
  isScoped: boolean
}

function parseOptionalSlug(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

export async function resolveMediaAdminActionContext(
  formData: FormData
): Promise<MediaAdminActionContext> {
  const submittedSlug = parseOptionalSlug(formData.get("businessSlug"))
  const businessSlug = submittedSlug ?? DEMO_BUSINESS_SLUG
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id, slug")
    .eq("slug", businessSlug)
    .single()

  if (error || !business) {
    throw new Error("Could not load media business.")
  }

  return {
    businessId: business.id as string,
    businessSlug: business.slug as string,
    isScoped: Boolean(submittedSlug),
  }
}

export function getMediaAdminActionHref(context: MediaAdminActionContext) {
  return context.isScoped
    ? getMediaAdminHref(context.businessSlug)
    : getMediaAdminHref()
}

export function getMediaAdminActionBusinessSlug(
  context: MediaAdminActionContext
) {
  return context.isScoped ? context.businessSlug : undefined
}
