import { ProductVariantAssignmentsClient } from "@/features/admin-products/components/ProductVariantAssignmentsClient"
import { getProductVariantAssignmentData } from "@/features/admin-products/queries/get-product-variant-assignments"

type ProductVariantAssignmentsPageProps = {
  productId?: string
}

export async function ProductVariantAssignmentsPage({
  productId,
}: ProductVariantAssignmentsPageProps) {
  const data = await getProductVariantAssignmentData(productId)

  return <ProductVariantAssignmentsClient data={data} />
}
