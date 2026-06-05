import { ProductCategoriesBrowser } from "@/features/admin-products/components/ProductCategoriesBrowser"
import { getProductCategories } from "@/features/admin-products/queries/get-product-categories"
import type { ProductAdminBusinessContextInput } from "@/features/admin-products/utils/product-admin-business-context"

type ProductCategoriesManagementPageProps = {
  businessContext?: ProductAdminBusinessContextInput
  businessSlug?: string
  writesEnabled?: boolean
}

export async function ProductCategoriesManagementPage({
  businessContext,
  businessSlug,
  writesEnabled = true,
}: ProductCategoriesManagementPageProps = {}) {
  const { businessName, categories } = await getProductCategories(businessContext)

  return (
    <ProductCategoriesBrowser
      businessName={businessName}
      categories={categories}
      businessSlug={businessSlug}
      writesEnabled={writesEnabled}
    />
  )
}
