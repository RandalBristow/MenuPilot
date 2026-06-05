import { VariantGroupsBrowser } from "@/features/admin-products/components/VariantGroupsBrowser"
import { getVariantGroups } from "@/features/admin-products/queries/get-variant-groups"
import type { ProductAdminBusinessContextInput } from "@/features/admin-products/utils/product-admin-business-context"

type VariantGroupsPageProps = {
  businessContext?: ProductAdminBusinessContextInput
  businessSlug?: string
  writesEnabled?: boolean
}

export async function VariantGroupsPage({
  businessContext,
  businessSlug,
  writesEnabled = true,
}: VariantGroupsPageProps = {}) {
  const data = await getVariantGroups(businessContext)

  return (
    <VariantGroupsBrowser
      data={data}
      businessSlug={businessSlug}
      writesEnabled={writesEnabled}
    />
  )
}
