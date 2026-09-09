import { ProductVariantAssignmentsPage } from "@/features/admin-products/components/ProductVariantAssignmentsPage"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessVariantAssignmentsRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function BusinessVariantAssignmentsRoutePage({
  params,
  searchParams,
}: BusinessVariantAssignmentsRoutePageProps) {
  const [{ businessSlug }, { productId }] = await Promise.all([
    params,
    searchParams,
  ])
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <ProductVariantAssignmentsPage
      productId={productId}
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
