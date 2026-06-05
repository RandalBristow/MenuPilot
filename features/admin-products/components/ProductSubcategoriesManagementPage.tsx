import { ProductSubcategoriesBrowser } from "@/features/admin-products/components/ProductSubcategoriesBrowser"
import { getProductSubcategories } from "@/features/admin-products/queries/get-product-subcategories"
import type { ProductAdminBusinessContextInput } from "@/features/admin-products/utils/product-admin-business-context"

type ProductSubcategoriesManagementPageProps = {
  categoryId?: string
  businessContext?: ProductAdminBusinessContextInput
  businessSlug?: string
  writesEnabled?: boolean
}

export async function ProductSubcategoriesManagementPage({
  categoryId,
  businessContext,
  businessSlug,
  writesEnabled = true,
}: ProductSubcategoriesManagementPageProps) {
  const { businessName, categories, subcategories } =
    await getProductSubcategories(businessContext)

  return (
    <ProductSubcategoriesBrowser
      businessName={businessName}
      categories={categories}
      subcategories={subcategories}
      initialCategoryId={categoryId}
      businessSlug={businessSlug}
      writesEnabled={writesEnabled}
    />
  )
}
