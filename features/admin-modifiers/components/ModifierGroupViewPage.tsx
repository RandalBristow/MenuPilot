import { notFound } from "next/navigation"
import { ModifierSubgroupListClient } from "@/features/admin-modifiers/components/ModifierSubgroupListClient"
import { getModifierGroupDetail } from "@/features/admin-modifiers/queries/get-modifier-group-detail"
import type { ModifierAdminBusinessContextInput } from "@/features/admin-modifiers/utils/modifier-admin-business-context"

type ModifierGroupViewPageProps = {
  groupId: string
  productId?: string
  businessContext?: ModifierAdminBusinessContextInput
  businessSlug?: string
}

export async function ModifierGroupViewPage({
  groupId,
  productId,
  businessContext,
  businessSlug,
}: ModifierGroupViewPageProps) {
  const data = await getModifierGroupDetail(groupId, productId, businessContext)

  if (!data) {
    notFound()
  }

  return <ModifierSubgroupListClient data={data} businessSlug={businessSlug} />
}
