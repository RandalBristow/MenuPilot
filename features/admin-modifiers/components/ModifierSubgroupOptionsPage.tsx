import { notFound } from "next/navigation"
import { ModifierSubgroupOptionsClient } from "@/features/admin-modifiers/components/ModifierSubgroupOptionsClient"
import { getModifierGroupDetail } from "@/features/admin-modifiers/queries/get-modifier-group-detail"

type ModifierSubgroupOptionsPageProps = {
  groupId: string
  subgroupId: string
  productId?: string
}

export async function ModifierSubgroupOptionsPage({
  groupId,
  subgroupId,
  productId,
}: ModifierSubgroupOptionsPageProps) {
  const data = await getModifierGroupDetail(groupId, productId)

  if (!data) {
    notFound()
  }

  const subgroup = data.group.optionGroups.find((item) => item.id === subgroupId)

  if (!subgroup) {
    notFound()
  }

  return <ModifierSubgroupOptionsClient data={data} subgroup={subgroup} />
}
