import { ProductDetailPage } from "@/features/admin-products/components/ProductDetailPage"

type AdminEditProductRoutePageProps = {
  params: Promise<{
    productId: string
  }>
}

export default async function AdminEditProductRoutePage({
  params,
}: AdminEditProductRoutePageProps) {
  const { productId } = await params

  return <ProductDetailPage productId={productId} />
}
