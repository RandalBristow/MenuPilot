import { ProductModifierGroupsClient } from "@/features/admin-products/components/ProductModifierGroupsClient"
import { getProductModifierGroupManagementData } from "@/features/admin-products/queries/get-product-management-data"
import type { ProductAdminBusinessContextInput } from "@/features/admin-products/utils/product-admin-business-context"

type ProductModifierGroupsPageProps = {
  productId?: string
  businessContext?: ProductAdminBusinessContextInput
  businessSlug?: string
  writesEnabled?: boolean
}

export async function ProductModifierGroupsPage({
  productId,
  businessContext,
  businessSlug,
  writesEnabled = true,
}: ProductModifierGroupsPageProps) {
  const data = await getProductModifierGroupManagementData(
    productId,
    businessContext
  )

  return (
    <ProductModifierGroupsClient
      data={data}
      businessSlug={businessSlug}
      writesEnabled={writesEnabled}
    />
  )
}
