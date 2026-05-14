import { ProductModifierGroupsPage } from "@/features/admin-products/components/ProductModifierGroupsPage"

type AdminProductModifierGroupsRoutePageProps = {
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function AdminProductModifierGroupsRoutePage({
  searchParams,
}: AdminProductModifierGroupsRoutePageProps) {
  const { productId } = await searchParams

  return <ProductModifierGroupsPage productId={productId} />
}
