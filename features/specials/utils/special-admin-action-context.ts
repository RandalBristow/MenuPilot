import { supabaseAdmin } from "@/lib/supabase/admin"

export type SpecialAdminActionContext = {
  businessId: string
  businessSlug: string
}

function parseBusinessSlug(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Business context is required.")
  }

  return value.trim()
}

export async function resolveSpecialAdminActionContext(
  formData: FormData
): Promise<SpecialAdminActionContext> {
  const businessSlug = parseBusinessSlug(formData.get("businessSlug"))
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id, slug")
    .eq("slug", businessSlug)
    .single()

  if (error || !business) {
    throw new Error("Could not load specials business.")
  }

  return {
    businessId: business.id as string,
    businessSlug: business.slug as string,
  }
}
