import { notFound } from "next/navigation"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"

export async function resolveScopedModifierAdminBusiness(businessSlug: string) {
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) {
    notFound()
  }

  return business
}
