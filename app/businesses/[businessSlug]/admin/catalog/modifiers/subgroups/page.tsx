import { ModifierSubgroupsManagementPage } from "@/features/admin-modifiers/components/ModifierSubgroupsManagementPage"
import { resolveScopedModifierAdminBusiness } from "@/features/admin-modifiers/utils/resolve-scoped-modifier-admin-business"

type BusinessAdminModifierSubgroupsRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessAdminModifierSubgroupsRoutePage({
  params,
}: BusinessAdminModifierSubgroupsRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedModifierAdminBusiness(businessSlug)

  return (
    <ModifierSubgroupsManagementPage
      businessContext={{ business }}
      businessSlug={business.slug}
    />
  )
}
