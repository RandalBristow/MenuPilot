import { notFound } from "next/navigation"
import { ModifierSubgroupListClient } from "@/features/admin-modifiers/components/ModifierSubgroupListClient"
import { getModifierGroupDetail } from "@/features/admin-modifiers/queries/get-modifier-group-detail"

type ModifierGroupViewPageProps = {
  groupId: string
}

export async function ModifierGroupViewPage({
  groupId,
}: ModifierGroupViewPageProps) {
  const data = await getModifierGroupDetail(groupId)

  if (!data) {
    notFound()
  }

  return <ModifierSubgroupListClient data={data} />
}
