import { ProductCategoriesManagementPage } from "@/features/admin-products/components/ProductCategoriesManagementPage"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessProductCategoriesRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessProductCategoriesRoutePage({
  params,
}: BusinessProductCategoriesRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <ProductCategoriesManagementPage
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
