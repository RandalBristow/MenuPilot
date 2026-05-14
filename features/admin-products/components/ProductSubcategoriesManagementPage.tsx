import { ProductSubcategoriesBrowser } from "@/features/admin-products/components/ProductSubcategoriesBrowser"
import { getProductSubcategories } from "@/features/admin-products/queries/get-product-subcategories"

export async function ProductSubcategoriesManagementPage() {
  const { businessName, categories, subcategories } =
    await getProductSubcategories()

  return (
    <ProductSubcategoriesBrowser
      businessName={businessName}
      categories={categories}
      subcategories={subcategories}
    />
  )
}
