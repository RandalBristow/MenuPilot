import { notFound } from "next/navigation"
import { ModifierSubgroupOptionsClient } from "@/features/admin-modifiers/components/ModifierSubgroupOptionsClient"
import { getModifierGroupDetail } from "@/features/admin-modifiers/queries/get-modifier-group-detail"
import type { ModifierAdminBusinessContextInput } from "@/features/admin-modifiers/utils/modifier-admin-business-context"

type ModifierSubgroupOptionsPageProps = {
  groupId: string
  subgroupId: string
  productId?: string
  businessContext?: ModifierAdminBusinessContextInput
  businessSlug?: string
}

export async function ModifierSubgroupOptionsPage({
  groupId,
  subgroupId,
  productId,
  businessContext,
  businessSlug,
}: ModifierSubgroupOptionsPageProps) {
  const data = await getModifierGroupDetail(groupId, productId, businessContext)

  if (!data) {
    notFound()
  }

  const subgroup = data.group.optionGroups.find((item) => item.id === subgroupId)

  if (!subgroup) {
    notFound()
  }

  return (
    <ModifierSubgroupOptionsClient
      data={data}
      subgroup={subgroup}
      businessSlug={businessSlug}
    />
  )
}
