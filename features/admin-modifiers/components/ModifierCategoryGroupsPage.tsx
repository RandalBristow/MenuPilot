import { notFound } from "next/navigation"
import { ModifierCategoryGroupsClient } from "@/features/admin-modifiers/components/ModifierCategoryGroupsClient"
import { getModifierAdminData } from "@/features/admin-modifiers/queries/get-modifier-admin-data"

type ModifierCategoryGroupsPageProps = {
  categoryId: string
}

export async function ModifierCategoryGroupsPage({
  categoryId,
}: ModifierCategoryGroupsPageProps) {
  const { categories } = await getModifierAdminData()
  const category = categories.find((item) => item.id === categoryId)

  if (!category) {
    notFound()
  }

  return (
    <ModifierCategoryGroupsClient
      categories={categories}
      category={category}
    />
  )
}
