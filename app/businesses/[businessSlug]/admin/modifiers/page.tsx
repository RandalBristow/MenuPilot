import { ModifiersPage } from "@/features/admin-modifiers/components/ModifiersPage"
import { resolveScopedModifierAdminBusiness } from "@/features/admin-modifiers/utils/resolve-scoped-modifier-admin-business"

type BusinessAdminModifiersRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessAdminModifiersRoutePage({
  params,
}: BusinessAdminModifiersRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveScopedModifierAdminBusiness(businessSlug)

  return (
    <ModifiersPage
      businessContext={{ business }}
      businessSlug={business.slug}
    />
  )
}
