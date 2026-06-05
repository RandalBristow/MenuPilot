import { supabaseAdmin } from "@/lib/supabase/admin"
import { getModifierAdminHref } from "@/features/admin-modifiers/utils/modifier-admin-routes"

const DEMO_BUSINESS_SLUG = "pronto-demo"

export type ModifierAdminActionContext = {
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

export async function resolveModifierAdminActionContext(
  formData: FormData
): Promise<ModifierAdminActionContext> {
  const submittedSlug = parseOptionalSlug(formData.get("businessSlug"))
  const businessSlug = submittedSlug ?? DEMO_BUSINESS_SLUG
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id, slug")
    .eq("slug", businessSlug)
    .single()

  if (error || !business) {
    throw new Error("Could not load modifier business.")
  }

  return {
    businessId: business.id as string,
    businessSlug: business.slug as string,
    isScoped: Boolean(submittedSlug),
  }
}

export function getModifierAdminActionHref(
  context: ModifierAdminActionContext,
  path = ""
) {
  return context.isScoped
    ? getModifierAdminHref(path, context.businessSlug)
    : getModifierAdminHref(path)
}

export function getModifierAdminActionBusinessSlug(
  context: ModifierAdminActionContext
) {
  return context.isScoped ? context.businessSlug : undefined
}
