import { AdminProductsPage } from "@/features/admin-products/components/AdminProductsPage"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessProductsListRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessProductsListRoutePage({
  params,
}: BusinessProductsListRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <AdminProductsPage
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
