"use client"

import { useRouter } from "next/navigation"
import { ChevronRight, Plus } from "lucide-react"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ModifierCategoryFormDialog } from "@/features/admin-modifiers/components/ModifierCategoryFormDialog"
import type { ModifierGroupCategory } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

type ModifierGroupsBrowserProps = {
  businessName: string
  categories: ModifierGroupCategory[]
}

function sortCategories(categories: ModifierGroupCategory[]) {
  return [...categories].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}

export function ModifierGroupsBrowser({
  businessName,
  categories,
}: ModifierGroupsBrowserProps) {
  const router = useRouter()
  const sortedCategories = sortCategories(categories)

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <ThemedPageHeader
          title="Modifier Groups"
          description={`Reusable modifier group categories for ${businessName}.`}
          className="shrink-0 border-b pb-3"
        />

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {sortedCategories.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No modifier groups yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create top-level groups like Pizza, Wings, Subs, or Drinks.
              </p>
            </ThemedCard>
          ) : (
            sortedCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-label={`Open modifier group ${category.name}`}
                onClick={() =>
                  router.push(`/admin/modifiers/groups/${category.id}`)
                }
                className={
                  category.is_enabled
                    ? "block w-full text-left"
                    : "block w-full text-left opacity-75"
                }
              >
                <ThemedCard
                  className={
                    category.is_enabled
                      ? "overflow-hidden p-0"
                      : "overflow-hidden bg-muted/30 p-0"
                  }
                >
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <CompactRecordStatusIcon enabled={category.is_enabled} />
                        <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">
                          {category.name}
                        </div>
                      </div>

                      {category.description ? (
                        <p className="text-xs leading-5 text-muted-foreground">
                          {category.description}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>
                          {category.modifier_groups.length}{" "}
                          {category.modifier_groups.length === 1
                            ? "subgroup"
                            : "subgroups"}
                        </span>
                        <span>Sort {category.sort_order}</span>
                      </div>
                    </div>

                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  </div>
                </ThemedCard>
              </button>
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end">
            <ModifierCategoryFormDialog
              triggerIcon={<Plus aria-hidden="true" />}
              triggerAriaLabel="New Modifier Group"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
