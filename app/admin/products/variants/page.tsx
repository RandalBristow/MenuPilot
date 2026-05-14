import { ProductVariantsPage } from "@/features/admin-products/components/ProductVariantsPage"

type AdminProductVariantsRoutePageProps = {
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function AdminProductVariantsRoutePage({
  searchParams,
}: AdminProductVariantsRoutePageProps) {
  const { productId } = await searchParams

  return <ProductVariantsPage productId={productId} />
}
