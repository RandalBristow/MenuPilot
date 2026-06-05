import { ModifierGroupsManagementPage } from "@/features/admin-modifiers/components/ModifierGroupsManagementPage"
import { resolveScopedModifierAdminBusiness } from "@/features/admin-modifiers/utils/resolve-scoped-modifier-admin-business"

type BusinessAdminModifierGroupsRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessAdminModifierGroupsRoutePage({
  params,
}: BusinessAdminModifierGroupsRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedModifierAdminBusiness(businessSlug)

  return (
    <ModifierGroupsManagementPage
      businessContext={{ business }}
      businessSlug={business.slug}
    />
  )
}
