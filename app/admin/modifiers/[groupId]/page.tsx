import { ModifierGroupViewPage } from "@/features/admin-modifiers/components/ModifierGroupViewPage"

type AdminModifierGroupRoutePageProps = {
  params: Promise<{
    groupId: string
  }>
}

export default async function AdminModifierGroupRoutePage({
  params,
}: AdminModifierGroupRoutePageProps) {
  const { groupId } = await params

  return <ModifierGroupViewPage groupId={groupId} />
}
