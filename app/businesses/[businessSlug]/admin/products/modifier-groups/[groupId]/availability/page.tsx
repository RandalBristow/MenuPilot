import { ProductModifierAvailabilityPage } from "@/features/admin-products/components/ProductModifierAvailabilityPage"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessModifierAvailabilityRoutePageProps = {
  params: Promise<{
    businessSlug: string
    groupId: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function BusinessModifierAvailabilityRoutePage({
  params,
  searchParams,
}: BusinessModifierAvailabilityRoutePageProps) {
  const [{ businessSlug, groupId }, { productId }] = await Promise.all([
    params,
    searchParams,
  ])
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <ProductModifierAvailabilityPage
      modifierGroupId={groupId}
      productId={productId}
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
