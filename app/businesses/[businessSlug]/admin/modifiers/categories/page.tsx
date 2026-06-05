import { ModifierCategoriesManagementPage } from "@/features/admin-modifiers/components/ModifierCategoriesManagementPage"
import { resolveScopedModifierAdminBusiness } from "@/features/admin-modifiers/utils/resolve-scoped-modifier-admin-business"

type BusinessAdminModifierCategoriesRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessAdminModifierCategoriesRoutePage({
  params,
}: BusinessAdminModifierCategoriesRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedModifierAdminBusiness(businessSlug)

  return (
    <ModifierCategoriesManagementPage
      businessContext={{ business }}
      businessSlug={business.slug}
    />
  )
}
