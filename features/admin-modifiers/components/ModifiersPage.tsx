import { ModifierGroupsManagementPage } from "@/features/admin-modifiers/components/ModifierGroupsManagementPage"
import type { ModifierAdminBusinessContextInput } from "@/features/admin-modifiers/utils/modifier-admin-business-context"

export async function ModifiersPage({
  businessContext,
  businessSlug,
}: {
  businessContext?: ModifierAdminBusinessContextInput
  businessSlug?: string
} = {}) {
  return (
    <ModifierGroupsManagementPage
      businessContext={businessContext}
      businessSlug={businessSlug}
    />
  )
}
