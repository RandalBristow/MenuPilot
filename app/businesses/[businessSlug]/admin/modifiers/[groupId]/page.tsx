import { ModifierGroupViewPage } from "@/features/admin-modifiers/components/ModifierGroupViewPage"
import { resolveScopedModifierAdminBusiness } from "@/features/admin-modifiers/utils/resolve-scoped-modifier-admin-business"

type BusinessAdminModifierGroupRoutePageProps = {
  params: Promise<{
    businessSlug: string
    groupId: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function BusinessAdminModifierGroupRoutePage({
  params,
  searchParams,
}: BusinessAdminModifierGroupRoutePageProps) {
  const [{ businessSlug, groupId }, { productId }] = await Promise.all([
    params,
    searchParams,
  ])
  const business = await resolveScopedModifierAdminBusiness(businessSlug)

  return (
    <ModifierGroupViewPage
      groupId={groupId}
      productId={productId}
      businessContext={{ business }}
      businessSlug={business.slug}
    />
  )
}
