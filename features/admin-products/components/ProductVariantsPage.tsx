import { ProductVariantsClient } from "@/features/admin-products/components/ProductVariantsClient"
import { getProductManagementData } from "@/features/admin-products/queries/get-product-management-data"

type ProductVariantsPageProps = {
  productId?: string
}

export async function ProductVariantsPage({ productId }: ProductVariantsPageProps) {
  const data = await getProductManagementData(productId)

  return <ProductVariantsClient data={data} />
}
