import { ModifierCategoryGroupsPage } from "@/features/admin-modifiers/components/ModifierCategoryGroupsPage"

type AdminModifierCategoryGroupsRoutePageProps = {
  params: Promise<{
    categoryId: string
  }>
}

export default async function AdminModifierCategoryGroupsRoutePage({
  params,
}: AdminModifierCategoryGroupsRoutePageProps) {
  const { categoryId } = await params

  return <ModifierCategoryGroupsPage categoryId={categoryId} />
}
