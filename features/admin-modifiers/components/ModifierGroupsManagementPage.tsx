import { ModifiersCategoryBrowser } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"
import { getModifierAdminData } from "@/features/admin-modifiers/queries/get-modifier-admin-data"
import { ThemedHeading } from "@/components/themed/ThemedHeading"

export async function ModifierGroupsManagementPage() {
  const { businessName, categories } = await getModifierAdminData()

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-2">
          <ThemedHeading>Modifier Groups</ThemedHeading>
          <p className="text-sm text-muted-foreground">
            Manage product-attached modifier rule sets for {businessName}.
          </p>
        </div>

        <div className="min-h-0 flex-1">
          <ModifiersCategoryBrowser categories={categories} />
        </div>
      </div>
    </main>
  )
}
