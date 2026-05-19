import { ModifierSubgroupOptionsPage } from "@/features/admin-modifiers/components/ModifierSubgroupOptionsPage"

type AdminModifierSubgroupOptionsRoutePageProps = {
  params: Promise<{
    groupId: string
    subgroupId: string
  }>
}

export default async function AdminModifierSubgroupOptionsRoutePage({
  params,
}: AdminModifierSubgroupOptionsRoutePageProps) {
  const { groupId, subgroupId } = await params

  return (
    <ModifierSubgroupOptionsPage groupId={groupId} subgroupId={subgroupId} />
  )
}
