import { notFound } from "next/navigation"
import { ModifierCategoryGroupsClient } from "@/features/admin-modifiers/components/ModifierCategoryGroupsClient"
import { getModifierAdminData } from "@/features/admin-modifiers/queries/get-modifier-admin-data"
import type { ModifierAdminBusinessContextInput } from "@/features/admin-modifiers/utils/modifier-admin-business-context"

type ModifierCategoryGroupsPageProps = {
  categoryId: string
  businessContext?: ModifierAdminBusinessContextInput
  businessSlug?: string
}

export async function ModifierCategoryGroupsPage({
  categoryId,
  businessContext,
  businessSlug,
}: ModifierCategoryGroupsPageProps) {
  const { categories } = await getModifierAdminData(businessContext)
  const category = categories.find((item) => item.id === categoryId)

  if (!category) {
    notFound()
  }

  return (
    <ModifierCategoryGroupsClient
      categories={categories}
      category={category}
      businessSlug={businessSlug}
    />
  )
}
