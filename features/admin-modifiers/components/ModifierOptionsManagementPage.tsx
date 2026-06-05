import { ModifierOptionsBrowser } from "@/features/admin-modifiers/components/ModifierOptionsBrowser"
import { getModifierAdminData } from "@/features/admin-modifiers/queries/get-modifier-admin-data"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import type { ModifierAdminBusinessContextInput } from "@/features/admin-modifiers/utils/modifier-admin-business-context"

export async function ModifierOptionsManagementPage({
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
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-2">
          <ThemedHeading>Modifiers</ThemedHeading>
          <p className="text-sm text-muted-foreground">
            Manage selectable modifier options for {businessName}.
          </p>
        </div>

        <div className="min-h-0 flex-1">
          <ModifierOptionsBrowser
            categories={categories}
            businessSlug={businessSlug}
          />
        </div>
      </div>
    </main>
  )
}
