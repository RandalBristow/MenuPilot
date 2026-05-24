import { ProductModifierAvailabilityPage } from "@/features/admin-products/components/ProductModifierAvailabilityPage"

type AdminProductModifierAvailabilityRoutePageProps = {
  params: Promise<{
    groupId: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function AdminProductModifierAvailabilityRoutePage({
  params,
  searchParams,
}: AdminProductModifierAvailabilityRoutePageProps) {
  const { groupId } = await params
  const { productId } = await searchParams

  return (
    <ProductModifierAvailabilityPage
      modifierGroupId={groupId}
      productId={productId}
    />
  )
}
