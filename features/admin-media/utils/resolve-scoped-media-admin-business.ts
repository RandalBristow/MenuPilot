import { notFound } from "next/navigation"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"

export async function resolveScopedMediaAdminBusiness(businessSlug: string) {
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) {
    notFound()
  }

  return business
}
