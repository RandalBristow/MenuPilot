import { VariantGroupDetailPage } from "@/features/admin-products/components/VariantGroupDetailPage"

type AdminProductVariantGroupDetailRoutePageProps = {
  params: Promise<{
    groupId: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function AdminProductVariantGroupDetailRoutePage({
  params,
  searchParams,
}: AdminProductVariantGroupDetailRoutePageProps) {
  const { groupId } = await params
  const { productId } = await searchParams

  return <VariantGroupDetailPage groupId={groupId} productId={productId} />
}
