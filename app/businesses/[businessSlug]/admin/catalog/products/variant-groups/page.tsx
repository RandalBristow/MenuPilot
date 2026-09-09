import { VariantGroupsPage } from "@/features/admin-products/components/VariantGroupsPage"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessVariantGroupsRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessVariantGroupsRoutePage({
  params,
}: BusinessVariantGroupsRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <VariantGroupsPage
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
