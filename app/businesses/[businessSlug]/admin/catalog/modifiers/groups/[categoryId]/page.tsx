import { ModifierCategoryGroupsPage } from "@/features/admin-modifiers/components/ModifierCategoryGroupsPage"
import { resolveScopedModifierAdminBusiness } from "@/features/admin-modifiers/utils/resolve-scoped-modifier-admin-business"

type BusinessAdminModifierCategoryGroupsRoutePageProps = {
  params: Promise<{
    businessSlug: string
    categoryId: string
  }>
}

export default async function BusinessAdminModifierCategoryGroupsRoutePage({
  params,
}: BusinessAdminModifierCategoryGroupsRoutePageProps) {
  const { businessSlug, categoryId } = await params
  const business = await resolveScopedModifierAdminBusiness(businessSlug)

  return (
    <ModifierCategoryGroupsPage
      categoryId={categoryId}
      businessContext={{ business }}
      businessSlug={business.slug}
    />
  )
}
