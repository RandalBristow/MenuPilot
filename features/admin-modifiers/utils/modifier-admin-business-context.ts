import {
  resolveBusinessContext,
  resolveBusinessContextById,
} from "@/features/tenant/queries/resolve-business-context"
import type { TenantBusinessContext } from "@/features/tenant/types/tenant-context"

const DEMO_BUSINESS_SLUG = "pronto-demo"

export type ModifierAdminBusinessContextInput = {
  business?: TenantBusinessContext
  businessId?: string
  businessSlug?: string
}

export async function resolveModifierAdminBusinessContext(
  input: ModifierAdminBusinessContextInput = {}
): Promise<TenantBusinessContext> {
  if (input.business) {
    return input.business
  }

  const business = input.businessId
    ? await resolveBusinessContextById({ businessId: input.businessId })
    : await resolveBusinessContext({
        businessSlug: input.businessSlug ?? DEMO_BUSINESS_SLUG,
      })

  if (!business) {
    throw new Error("Could not load modifier business.")
  }

  return business
}
