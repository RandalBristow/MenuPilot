import { ProductDetailClient } from "@/features/admin-products/components/ProductDetailClient"
import { getProductFormData } from "@/features/admin-products/components/ProductForm"

type ProductDetailPageProps = {
  productId: string
}

export async function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const data = await getProductFormData(productId)

  if (!data.product) {
    throw new Error("Could not load product.")
  }

  return <ProductDetailClient data={data} />
}
