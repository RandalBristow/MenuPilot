import { ModifierSubgroupOptionsPage } from "@/features/admin-modifiers/components/ModifierSubgroupOptionsPage"

type AdminModifierSubgroupOptionsRoutePageProps = {
  params: Promise<{
    groupId: string
    subgroupId: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function AdminModifierSubgroupOptionsRoutePage({
  params,
  searchParams,
}: AdminModifierSubgroupOptionsRoutePageProps) {
  const { groupId, subgroupId } = await params
  const { productId } = await searchParams

  return (
    <ModifierSubgroupOptionsPage
      groupId={groupId}
      subgroupId={subgroupId}
      productId={productId}
    />
  )
}
