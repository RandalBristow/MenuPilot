import { ModifierGroupsBrowser } from "@/features/admin-modifiers/components/ModifierGroupsBrowser"
import { getModifierAdminData } from "@/features/admin-modifiers/queries/get-modifier-admin-data"
import type { ModifierAdminBusinessContextInput } from "@/features/admin-modifiers/utils/modifier-admin-business-context"

export async function ModifierGroupsManagementPage({
  businessContext,
  businessSlug,
}: {
  businessContext?: ModifierAdminBusinessContextInput
  businessSlug?: string
} = {}) {
  const { businessName, categories } = await getModifierAdminData(
    businessContext
  )

  return (
    <ModifierGroupsBrowser
      businessName={businessName}
      categories={categories}
      businessSlug={businessSlug}
    />
  )
}
