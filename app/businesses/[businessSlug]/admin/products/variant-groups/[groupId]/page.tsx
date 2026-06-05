import { VariantGroupDetailPage } from "@/features/admin-products/components/VariantGroupDetailPage"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessVariantGroupDetailRoutePageProps = {
  params: Promise<{
    businessSlug: string
    groupId: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function BusinessVariantGroupDetailRoutePage({
  params,
  searchParams,
}: BusinessVariantGroupDetailRoutePageProps) {
  const [{ businessSlug, groupId }, { productId }] = await Promise.all([
    params,
    searchParams,
  ])
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <VariantGroupDetailPage
      groupId={groupId}
      productId={productId}
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
