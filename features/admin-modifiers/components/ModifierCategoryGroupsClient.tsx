"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ModifierGroupFormDialog } from "@/features/admin-modifiers/components/ModifierGroupFormDialog"
import type {
  ModifierGroupCategory,
  RawModifierGroup,
} from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

type ModifierCategoryGroupsClientProps = {
  categories: ModifierGroupCategory[]
  category: ModifierGroupCategory
}

function sortGroups(groups: RawModifierGroup[]) {
  return [...groups].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}

function formatGroupRules(group: RawModifierGroup) {
  const requiredLabel = group.is_required ? "Required" : "Optional"
  const maxAllowed = group.max_allowed ?? "No max"

  return `${requiredLabel} - ${group.selection_type} - min ${group.min_required} - max ${maxAllowed}`
}

export function ModifierCategoryGroupsClient({
  categories,
  category,
}: ModifierCategoryGroupsClientProps) {
  const router = useRouter()
  const [selectedCategoryId, setSelectedCategoryId] = useState(category.id)
  const [activeGroup, setActiveGroup] = useState<RawModifierGroup | null>(null)
  const groups = sortGroups(category.modifier_groups)

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title="Modifier Subgroups"
            description={`Reusable subgroups inside ${category.name}.`}
          />
          <p className="truncate text-sm text-muted-foreground">
            {category.name}
          </p>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {groups.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No modifier subgroups yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add reusable subgroups like Crust Type, Toppings, or Sauce.
              </p>
            </ThemedCard>
          ) : (
            groups.map((group) => (
              <ThemedCard
                key={group.id}
                className={
                  group.is_enabled
                    ? "gap-0 overflow-hidden p-0"
                    : "gap-0 overflow-hidden bg-muted/30 p-0 opacity-75"
                }
              >
                <button
                  type="button"
                  aria-label={`Edit modifier subgroup ${group.name}`}
                  onClick={() => setActiveGroup(group)}
                  className="block w-full px-3 pt-2.5 text-left"
                >
                  <div className="space-y-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <CompactRecordStatusIcon enabled={group.is_enabled} />
                      <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">
                        {group.name}
                      </div>
                    </div>

                    <p className="text-xs leading-5 text-muted-foreground">
                      {formatGroupRules(group)}
                    </p>
                  </div>
                </button>

                <div className="flex justify-end px-3 pb-2.5 pt-1.5">
                  <ThemedButton
                    type="button"
                    variant="outline"
                    className="h-8 bg-background px-3 text-xs text-foreground hover:bg-muted"
                    onClick={() => router.push(`/admin/modifiers/${group.id}`)}
                  >
                    Manage Option Lists
                  </ThemedButton>
                </div>
              </ThemedCard>
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end gap-2">
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Back to modifier groups"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() => router.push("/admin/modifiers/groups")}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Back to modifier groups</span>
            </ThemedButton>
            <ModifierGroupFormDialog
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              triggerIcon={<Plus aria-hidden="true" />}
              triggerAriaLabel="New Modifier Subgroup"
              onCreated={setSelectedCategoryId}
            />
          </div>
        </div>

        {activeGroup ? (
          <ModifierGroupFormDialog
            open={Boolean(activeGroup)}
            onOpenChange={(open) => {
              if (!open) setActiveGroup(null)
            }}
            categories={categories}
            selectedCategoryId={category.id}
            mode="edit"
            group={activeGroup}
            onCreated={setSelectedCategoryId}
          />
        ) : null}
      </div>
    </main>
  )
}
