import { ProductSubcategoriesManagementPage } from "@/features/admin-products/components/ProductSubcategoriesManagementPage"

type AdminProductSubcategoriesRoutePageProps = {
  searchParams: Promise<{
    categoryId?: string
  }>
}

export default async function AdminProductSubcategoriesRoutePage({
  searchParams,
}: AdminProductSubcategoriesRoutePageProps) {
  const { categoryId } = await searchParams

  return <ProductSubcategoriesManagementPage categoryId={categoryId} />
}
