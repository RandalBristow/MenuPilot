"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ModifierCategoryFormDialog } from "@/features/admin-modifiers/components/ModifierCategoryFormDialog"
import type { ModifierCategory } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

type ModifierGroupsBrowserProps = {
  businessName: string
  categories: ModifierCategory[]
}

function sortCategories(categories: ModifierCategory[]) {
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
  const [activeCategory, setActiveCategory] =
    useState<ModifierCategory | null>(null)
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
              <ThemedCard
                key={category.id}
                role="button"
                tabIndex={0}
                aria-label={`Edit modifier group ${category.name}`}
                onClick={() => setActiveCategory(category)}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault()
                    setActiveCategory(category)
                  }
                }}
                className={
                  category.is_enabled
                    ? "cursor-pointer gap-0 overflow-hidden p-0"
                    : "cursor-pointer gap-0 overflow-hidden bg-muted/30 p-0 opacity-75"
                }
              >
                <div className="px-3 pt-2.5">
                  <div className="space-y-1.5">
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
                  </div>
                </div>

                <div className="flex justify-end px-3 pb-2.5 pt-1.5">
                  <ThemedButton
                    type="button"
                    variant="outline"
                    className="h-8 bg-background px-3 text-xs text-foreground hover:bg-muted"
                    onClick={(event) => {
                      event.stopPropagation()
                      router.push(`/admin/modifiers/groups/${category.id}`)
                    }}
                  >
                    Manage Subgroups
                  </ThemedButton>
                </div>
              </ThemedCard>
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end gap-2">
            <AdminBackButton
              fallbackHref="/admin/products"
              label="Back to product management"
            />
            <ModifierCategoryFormDialog
              triggerIcon={<Plus aria-hidden="true" />}
              triggerAriaLabel="New Modifier Group"
            />
          </div>
        </div>

        {activeCategory ? (
          <ModifierCategoryFormDialog
            open={Boolean(activeCategory)}
            onOpenChange={(open) => {
              if (!open) setActiveCategory(null)
            }}
            mode="edit"
            category={activeCategory}
          />
        ) : null}
      </div>
    </main>
  )
}
