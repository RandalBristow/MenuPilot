import { ProductModifierGroupsPage } from "@/features/admin-products/components/ProductModifierGroupsPage"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessModifierGroupsRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function BusinessModifierGroupsRoutePage({
  params,
  searchParams,
}: BusinessModifierGroupsRoutePageProps) {
  const [{ businessSlug }, { productId }] = await Promise.all([
    params,
    searchParams,
  ])
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <ProductModifierGroupsPage
      productId={productId}
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
