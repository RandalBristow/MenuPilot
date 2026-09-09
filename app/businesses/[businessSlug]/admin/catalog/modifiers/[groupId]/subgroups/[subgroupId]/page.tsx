import { ModifierSubgroupOptionsPage } from "@/features/admin-modifiers/components/ModifierSubgroupOptionsPage"
import { resolveScopedModifierAdminBusiness } from "@/features/admin-modifiers/utils/resolve-scoped-modifier-admin-business"

type BusinessAdminModifierSubgroupOptionsRoutePageProps = {
  params: Promise<{
    businessSlug: string
    groupId: string
    subgroupId: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function BusinessAdminModifierSubgroupOptionsRoutePage({
  params,
  searchParams,
}: BusinessAdminModifierSubgroupOptionsRoutePageProps) {
  const [{ businessSlug, groupId, subgroupId }, { productId }] =
    await Promise.all([params, searchParams])
  const business = await resolveScopedModifierAdminBusiness(businessSlug)

  return (
    <ModifierSubgroupOptionsPage
      groupId={groupId}
      subgroupId={subgroupId}
      productId={productId}
      businessContext={{ business }}
      businessSlug={business.slug}
    />
  )
}
