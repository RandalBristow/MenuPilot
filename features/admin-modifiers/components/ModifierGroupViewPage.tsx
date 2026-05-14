import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { ThemedAdminCard } from "@/components/themed/ThemedAdminCard"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { setModifierGroupEnabled } from "@/features/admin-modifiers/actions/set-modifier-group-enabled"
import { ModifierGroupFormDialog } from "@/features/admin-modifiers/components/ModifierGroupFormDialog"
import { getModifierAdminData } from "@/features/admin-modifiers/queries/get-modifier-admin-data"

type ModifierGroupViewPageProps = {
  groupId: string
}

function formatSelectionType(value: string) {
  return value.replaceAll("_", " ")
}

export async function ModifierGroupViewPage({
  groupId,
}: ModifierGroupViewPageProps) {
  const { categories } = await getModifierAdminData()
  const category = categories.find((currentCategory) =>
    currentCategory.modifier_groups.some((group) => group.id === groupId)
  )
  const group = category?.modifier_groups.find(
    (currentGroup) => currentGroup.id === groupId
  )

  if (!category || !group) {
    notFound()
  }

  const maxAllowed = group.max_allowed ?? "No max"
  const optionCount = group.modifier_options?.length ?? 0
  const subgroupCount = group.modifier_option_groups?.length ?? 0

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <ThemedPageHeader
          title={group.name}
          description={`Modifier group in ${category.name}`}
          className="shrink-0"
        />

        <ThemedAdminCard className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="no-scrollbar flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Status
                </p>
                <p>{group.is_enabled ? "Enabled" : "Disabled"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Selection
                </p>
                <p className="capitalize">
                  {formatSelectionType(group.selection_type)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Required
                </p>
                <p>{group.is_required ? "Required" : "Optional"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Limits
                </p>
                <p>
                  min {group.min_required} - max {maxAllowed}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Subgroups
                </p>
                <p>{subgroupCount}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Options
                </p>
                <p>{optionCount}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-background p-4">
            <form action={setModifierGroupEnabled}>
              <input type="hidden" name="modifierGroupId" value={group.id} />
              <input
                type="hidden"
                name="isEnabled"
                value={String(!group.is_enabled)}
              />
              <ThemedButton
                type="submit"
                variant="outline"
                size="icon"
                aria-label={
                  group.is_enabled
                    ? `Disable modifier group ${group.name}`
                    : `Enable modifier group ${group.name}`
                }
                className="size-10 bg-background text-foreground hover:bg-muted"
              >
                {group.is_enabled ? (
                  <ThumbsUp aria-hidden="true" />
                ) : (
                  <ThumbsDown aria-hidden="true" />
                )}
                <span className="sr-only">
                  {group.is_enabled ? "Disable" : "Enable"} modifier group
                </span>
              </ThemedButton>
            </form>
            <ModifierGroupFormDialog
              categories={categories}
              selectedCategoryId={category.id}
              mode="edit"
              group={group}
              triggerIcon={<Pencil aria-hidden="true" />}
              triggerAriaLabel={`Edit modifier group ${group.name}`}
            />
            <ThemedButton
              asChild
              variant="outline"
              size="icon"
              aria-label="Close"
              className="size-10 bg-background text-foreground hover:bg-muted"
            >
              <Link href="/admin/modifiers/groups">
                <X aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Link>
            </ThemedButton>
          </div>
        </ThemedAdminCard>
      </div>
    </main>
  )
}
