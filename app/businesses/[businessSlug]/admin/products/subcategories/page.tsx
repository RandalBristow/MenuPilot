import { ProductSubcategoriesManagementPage } from "@/features/admin-products/components/ProductSubcategoriesManagementPage"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessProductSubcategoriesRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
  searchParams: Promise<{
    categoryId?: string
  }>
}

export default async function BusinessProductSubcategoriesRoutePage({
  params,
  searchParams,
}: BusinessProductSubcategoriesRoutePageProps) {
  const [{ businessSlug }, { categoryId }] = await Promise.all([
    params,
    searchParams,
  ])
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <ProductSubcategoriesManagementPage
      categoryId={categoryId}
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
