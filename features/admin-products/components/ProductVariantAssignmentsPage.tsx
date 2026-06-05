import { ProductVariantAssignmentsClient } from "@/features/admin-products/components/ProductVariantAssignmentsClient"
import { getProductVariantAssignmentData } from "@/features/admin-products/queries/get-product-variant-assignments"
import type { ProductAdminBusinessContextInput } from "@/features/admin-products/utils/product-admin-business-context"

type ProductVariantAssignmentsPageProps = {
  productId?: string
  businessContext?: ProductAdminBusinessContextInput
  businessSlug?: string
  writesEnabled?: boolean
}

export async function ProductVariantAssignmentsPage({
  productId,
  businessContext,
  businessSlug,
  writesEnabled = true,
}: ProductVariantAssignmentsPageProps) {
  const data = await getProductVariantAssignmentData(productId, businessContext)

  return (
    <ProductVariantAssignmentsClient
      data={data}
      businessSlug={businessSlug}
      writesEnabled={writesEnabled}
    />
  )
}
