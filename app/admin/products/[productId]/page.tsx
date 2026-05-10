import { ProductForm } from "@/features/admin-products/components/ProductForm"

type AdminEditProductRoutePageProps = {
  params: Promise<{
    productId: string
  }>
}

export default async function AdminEditProductRoutePage({
  params,
}: AdminEditProductRoutePageProps) {
  const { productId } = await params

  return <ProductForm productId={productId} />
}
