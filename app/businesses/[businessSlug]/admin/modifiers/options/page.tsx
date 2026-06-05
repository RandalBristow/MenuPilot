import { ModifierOptionsManagementPage } from "@/features/admin-modifiers/components/ModifierOptionsManagementPage"
import { resolveScopedModifierAdminBusiness } from "@/features/admin-modifiers/utils/resolve-scoped-modifier-admin-business"

type BusinessAdminModifierOptionsRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessAdminModifierOptionsRoutePage({
  params,
}: BusinessAdminModifierOptionsRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedModifierAdminBusiness(businessSlug)

  return (
    <ModifierOptionsManagementPage
      businessContext={{ business }}
      businessSlug={business.slug}
    />
  )
}
