import { ProductModifierGroupsClient } from "@/features/admin-products/components/ProductModifierGroupsClient"
import { getProductModifierGroupManagementData } from "@/features/admin-products/queries/get-product-management-data"

type ProductModifierGroupsPageProps = {
  productId?: string
}

export async function ProductModifierGroupsPage({
  productId,
}: ProductModifierGroupsPageProps) {
  const data = await getProductModifierGroupManagementData(productId)

  return <ProductModifierGroupsClient data={data} />
}
