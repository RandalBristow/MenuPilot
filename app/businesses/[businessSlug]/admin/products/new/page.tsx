import { ProductForm } from "@/features/admin-products/components/ProductForm"
import { resolveScopedProductAdminBusiness } from "@/features/admin-products/utils/resolve-scoped-product-admin-business"

type BusinessNewProductRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessNewProductRoutePage({
  params,
}: BusinessNewProductRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedProductAdminBusiness(businessSlug)

  return (
    <ProductForm
      businessContext={{ business }}
      businessSlug={business.slug}
      writesEnabled
    />
  )
}
