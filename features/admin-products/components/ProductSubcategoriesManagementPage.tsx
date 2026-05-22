import { ProductSubcategoriesBrowser } from "@/features/admin-products/components/ProductSubcategoriesBrowser"
import { getProductSubcategories } from "@/features/admin-products/queries/get-product-subcategories"

type ProductSubcategoriesManagementPageProps = {
  categoryId?: string
}

export async function ProductSubcategoriesManagementPage({
  categoryId,
}: ProductSubcategoriesManagementPageProps) {
  const { businessName, categories, subcategories } =
    await getProductSubcategories()

  return (
    <ProductSubcategoriesBrowser
      businessName={businessName}
      categories={categories}
      subcategories={subcategories}
      initialCategoryId={categoryId}
    />
  )
}
