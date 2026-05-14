import { notFound } from "next/navigation"
import { ProductDetailClient } from "@/features/admin-products/components/ProductDetailClient"
import { getProductFormData } from "@/features/admin-products/components/ProductForm"

type ProductDetailPageProps = {
  productId: string
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function ProductDetailPage({ productId }: ProductDetailPageProps) {
  if (!isUuid(productId)) {
    notFound()
  }

  let data

  try {
    data = await getProductFormData(productId)
  } catch (error) {
    if (error instanceof Error && error.message === "Could not load product.") {
      notFound()
    }

    throw error
  }

  if (!data.product) {
    notFound()
  }

  return <ProductDetailClient data={data} />
}
