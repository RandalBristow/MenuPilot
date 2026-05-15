import { ProductVariantAssignmentsPage } from "@/features/admin-products/components/ProductVariantAssignmentsPage"

type AdminProductVariantAssignmentsRoutePageProps = {
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function AdminProductVariantAssignmentsRoutePage({
  searchParams,
}: AdminProductVariantAssignmentsRoutePageProps) {
  const { productId } = await searchParams

  return <ProductVariantAssignmentsPage productId={productId} />
}
