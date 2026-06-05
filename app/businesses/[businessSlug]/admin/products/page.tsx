import { ProductManagementHub } from "@/features/admin-products/components/ProductManagementHub"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessProductsRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessProductsRoutePage({
  params,
}: BusinessProductsRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return <ProductManagementHub businessSlug={business.slug} />
}
