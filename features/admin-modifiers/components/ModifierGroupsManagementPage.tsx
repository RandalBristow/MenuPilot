import { ModifierGroupsBrowser } from "@/features/admin-modifiers/components/ModifierGroupsBrowser"
import { getModifierAdminData } from "@/features/admin-modifiers/queries/get-modifier-admin-data"

export async function ModifierGroupsManagementPage() {
  const { businessName, categories } = await getModifierAdminData()

  return <ModifierGroupsBrowser businessName={businessName} categories={categories} />
}
