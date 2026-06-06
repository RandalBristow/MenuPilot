"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ModifierGroupFormDialog } from "@/features/admin-modifiers/components/ModifierGroupFormDialog"
import { getNextModifierGroupSortOrder } from "@/features/admin-modifiers/utils/modifier-group-sort-order"
import {
  MODIFIER_ADMIN_ROW_CARD_CLASS,
  MODIFIER_ADMIN_ROW_CLASS,
} from "@/features/admin-modifiers/components/modifier-admin-row-styles"
import { getModifierAdminHref } from "@/features/admin-modifiers/utils/modifier-admin-routes"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import type {
  ModifierCategory,
  RawModifierGroup,
} from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

function getVisibleGroups({
  categories,
  selectedCategoryId,
}: {
  categories: ModifierCategory[]
  selectedCategoryId: string
}) {
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId
  )

  return {
    selectedCategory,
    visibleGroups: selectedCategory?.modifier_groups ?? [],
  }
}

export function ModifierSubgroupsBrowser({
  businessSlug,
  categories,
}: {
  businessSlug?: string
  categories: ModifierCategory[]
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? ""
  )
  const { selectedCategory, visibleGroups } = useMemo(
    () => getVisibleGroups({ categories, selectedCategoryId }),
    [categories, selectedCategoryId]
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b pb-1.5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <ThemedButton
              key={category.id}
              type="button"
              size="sm"
              className={
                category.id === selectedCategoryId
                  ? "shrink-0 rounded-full"
                  : "shrink-0 rounded-full border bg-background text-foreground hover:bg-muted"
              }
              onClick={() => {
                setSelectedCategoryId(category.id)
              }}
            >
              {category.name}
            </ThemedButton>
          ))}
        </div>
      </div>

      {selectedCategory && visibleGroups.length > 0 ? (
        <CategorySubgroupRows
          businessSlug={businessSlug}
          categories={categories}
          selectedCategory={selectedCategory}
          subgroups={visibleGroups}
          onCreated={setSelectedCategoryId}
        />
      ) : (
        <EmptyCategorySubgroupState
          businessSlug={businessSlug}
          categories={categories}
          selectedCategory={selectedCategory}
          onCreated={setSelectedCategoryId}
        />
      )}
    </div>
  )
}

function formatSelectionType(value: string) {
  return value.replaceAll("_", " ")
}

function formatSubgroupRules(group: RawModifierGroup) {
  const requiredLabel = group.is_required ? "Required" : "Optional"
  const maxAllowed = group.max_allowed ?? "No max"

  return `${requiredLabel} - ${formatSelectionType(group.selection_type)} - min ${group.min_required} - max ${maxAllowed}`
}

function EmptyCategorySubgroupState({
  businessSlug,
  categories,
  selectedCategory,
  onCreated,
}: {
  businessSlug?: string
  categories: ModifierCategory[]
  selectedCategory: ModifierCategory | undefined
  onCreated: (categoryId: string) => void
}) {
  const nextSortOrder = getNextModifierGroupSortOrder({
    modifierGroups: selectedCategory?.modifier_groups ?? [],
  })

  return (
    <>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-20 pt-3">
        <ThemedCard className="p-5 text-center">
          <p className="font-semibold">
            {selectedCategory
              ? `No subgroups found in ${selectedCategory.name}`
              : "No modifier categories found"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedCategory
              ? "Add a subgroup before creating option lists."
              : "Create a modifier category before adding subgroups."}
          </p>
        </ThemedCard>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <AdminBackButton
            fallbackHref={getModifierAdminHref("", businessSlug)}
            label="Back to modifier management"
          />
          {selectedCategory ? (
            <ModifierGroupFormDialog
              businessSlug={businessSlug}
              categories={categories}
              selectedCategoryId={selectedCategory.id}
              triggerIcon={<Plus aria-hidden="true" />}
              triggerAriaLabel="Add modifier subgroup"
              nextSortOrder={nextSortOrder}
              onCreated={onCreated}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}

function CategorySubgroupRows({
  businessSlug,
  categories,
  selectedCategory,
  subgroups,
  onCreated,
}: {
  businessSlug?: string
  categories: ModifierCategory[]
  selectedCategory: ModifierCategory
  subgroups: RawModifierGroup[]
  onCreated: (categoryId: string) => void
}) {
  const [activeSubgroup, setActiveSubgroup] = useState<RawModifierGroup | null>(
    null
  )
  const nextSortOrder = getNextModifierGroupSortOrder({
    modifierGroups: subgroups,
  })

  return (
    <>
      <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-20 pt-3">
        {subgroups.map((subgroup) => (
          <ThemedCard
            key={subgroup.id}
            role="button"
            tabIndex={0}
            aria-label={`Edit modifier subgroup ${subgroup.name}`}
            onClick={() => setActiveSubgroup(subgroup)}
            onKeyDown={(event) => {
              if (
                event.target === event.currentTarget &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault()
                setActiveSubgroup(subgroup)
              }
            }}
            className={
              subgroup.is_enabled
                ? MODIFIER_ADMIN_ROW_CARD_CLASS
                : `${MODIFIER_ADMIN_ROW_CARD_CLASS} bg-muted/30 opacity-75`
            }
          >
            <CompactRecordRow
              className={MODIFIER_ADMIN_ROW_CLASS}
              title={subgroup.name}
              statusIcon={
                <CompactRecordStatusIcon enabled={subgroup.is_enabled} />
              }
              description={formatSubgroupRules(subgroup)}
              metadata={<span>Sort {subgroup.sort_order}</span>}
              rightAction={
                <ThemedButton
                  asChild
                  variant="outline"
                  className="h-8 bg-background px-3 text-xs text-foreground hover:bg-muted"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Link href={getModifierAdminHref(subgroup.id, businessSlug)}>
                    Manage Option Lists
                  </Link>
                </ThemedButton>
              }
            />
          </ThemedCard>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <AdminBackButton
            fallbackHref={getModifierAdminHref("", businessSlug)}
            label="Back to modifier management"
          />
          <ModifierGroupFormDialog
            businessSlug={businessSlug}
            categories={categories}
            selectedCategoryId={selectedCategory.id}
            triggerIcon={<Plus aria-hidden="true" />}
            triggerAriaLabel="Add modifier subgroup"
            nextSortOrder={nextSortOrder}
            onCreated={onCreated}
          />
        </div>
      </div>

      {activeSubgroup ? (
        <ModifierGroupFormDialog
          open={Boolean(activeSubgroup)}
          onOpenChange={(open) => {
            if (!open) setActiveSubgroup(null)
          }}
          categories={categories}
          selectedCategoryId={selectedCategory.id}
          mode="edit"
          nextSortOrder={nextSortOrder}
          group={activeSubgroup}
          onCreated={onCreated}
          businessSlug={businessSlug}
        />
      ) : null}
    </>
  )
}
