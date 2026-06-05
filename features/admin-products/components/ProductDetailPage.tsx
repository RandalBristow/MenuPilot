import { notFound } from "next/navigation"
import { ProductDetailClient } from "@/features/admin-products/components/ProductDetailClient"
import { getProductFormData } from "@/features/admin-products/components/ProductForm"
import type { ProductAdminBusinessContextInput } from "@/features/admin-products/utils/product-admin-business-context"

type ProductDetailPageProps = {
  productId: string
  businessContext?: ProductAdminBusinessContextInput
  businessSlug?: string
  writesEnabled?: boolean
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function ProductDetailPage({
  productId,
  businessContext,
  businessSlug,
  writesEnabled = true,
}: ProductDetailPageProps) {
  if (!isUuid(productId)) {
    notFound()
  }

  let data

  try {
    data = await getProductFormData(productId, businessContext)
  } catch (error) {
    if (error instanceof Error && error.message === "Could not load product.") {
      notFound()
    }

    throw error
  }

  if (!data.product) {
    notFound()
  }

  return (
    <ProductDetailClient
      data={data}
      businessSlug={businessSlug}
      writesEnabled={writesEnabled}
    />
  )
}
