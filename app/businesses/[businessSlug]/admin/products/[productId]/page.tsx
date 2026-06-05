import { ProductDetailPage } from "@/features/admin-products/components/ProductDetailPage"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessProductDetailRoutePageProps = {
  params: Promise<{
    businessSlug: string
    productId: string
  }>
}

export default async function BusinessProductDetailRoutePage({
  params,
}: BusinessProductDetailRoutePageProps) {
  const { businessSlug, productId } = await params
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <ProductDetailPage
      productId={productId}
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
