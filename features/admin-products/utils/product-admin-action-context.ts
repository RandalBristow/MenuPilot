import { supabaseAdmin } from "@/lib/supabase/admin"
import { getProductAdminHref } from "@/features/admin-products/utils/product-admin-routes"

const DEMO_BUSINESS_SLUG = "pronto-demo"

export type ProductAdminActionContext = {
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

export async function resolveProductAdminActionContext(
  formData: FormData
): Promise<ProductAdminActionContext> {
  const submittedSlug = parseOptionalSlug(formData.get("businessSlug"))
  const businessSlug = submittedSlug ?? DEMO_BUSINESS_SLUG
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id, slug")
    .eq("slug", businessSlug)
    .single()

  if (error || !business) {
    throw new Error("Could not load product business.")
  }

  return {
    businessId: business.id as string,
    businessSlug: business.slug as string,
    isScoped: Boolean(submittedSlug),
  }
}

export function getProductAdminActionHref(
  context: ProductAdminActionContext,
  path = ""
) {
  return context.isScoped
    ? getProductAdminHref(path, context.businessSlug)
    : getProductAdminHref(path)
}

export function getProductAdminActionRevalidatePaths({
  context,
  productId,
}: {
  context: ProductAdminActionContext
  productId?: string
}) {
  const paths = [
    getProductAdminActionHref(context),
    getProductAdminActionHref(context, "list"),
  ]

  if (productId) {
    paths.push(getProductAdminActionHref(context, productId))
  }

  return paths
}
