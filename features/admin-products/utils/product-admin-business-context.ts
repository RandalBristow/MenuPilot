import {
  resolveBusinessContext,
  resolveBusinessContextById,
} from "@/features/tenant/queries/resolve-business-context"
import type { TenantBusinessContext } from "@/features/tenant/types/tenant-context"

const DEMO_BUSINESS_SLUG = "pronto-demo"

export type ProductAdminBusinessContextInput = {
  business?: TenantBusinessContext
  businessId?: string
  businessSlug?: string
}

export async function resolveProductAdminBusinessContext(
  input: ProductAdminBusinessContextInput = {}
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
    throw new Error("Could not load product business.")
  }

  return business
}
