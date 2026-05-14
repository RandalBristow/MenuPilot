import { ProductCategoriesBrowser } from "@/features/admin-products/components/ProductCategoriesBrowser"
import { getProductCategories } from "@/features/admin-products/queries/get-product-categories"

export async function ProductCategoriesManagementPage() {
  const { businessName, categories } = await getProductCategories()

  return (
    <ProductCategoriesBrowser
      businessName={businessName}
      categories={categories}
    />
  )
}
