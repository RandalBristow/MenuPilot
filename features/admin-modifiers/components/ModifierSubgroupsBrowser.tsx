"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ModifierOptionGroupFormDialog } from "@/features/admin-modifiers/components/ModifierOptionGroupFormDialog"
import {
  getNextModifierOptionGroupSortOrder,
  sortModifierOptionGroups,
} from "@/features/admin-modifiers/utils/modifier-option-group-sort-order"
import {
  MODIFIER_ADMIN_ROW_CARD_CLASS,
  MODIFIER_ADMIN_ROW_CLASS,
} from "@/features/admin-modifiers/components/modifier-admin-row-styles"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import type {
  ModifierCategory,
  RawModifierGroup,
  RawModifierOptionGroup,
} from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

function getGroups(categories: ModifierCategory[]) {
  return categories.flatMap((category) =>
    category.modifier_groups.map((group) => ({
      category,
      group,
    }))
  )
}

export function ModifierSubgroupsBrowser({
  categories,
}: {
  categories: ModifierCategory[]
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? ""
  )
  const groups = useMemo(() => getGroups(categories), [categories])
  const visibleGroups = groups.filter(
    ({ category }) => category.id === selectedCategoryId
  )
  const [selectedGroupId, setSelectedGroupId] = useState(
    visibleGroups[0]?.group.id ?? groups[0]?.group.id ?? ""
  )
  const selectedGroup =
    groups.find(({ group }) => group.id === selectedGroupId)?.group ??
    visibleGroups[0]?.group ??
    null
  const subgroups = sortModifierOptionGroups(
    selectedGroup?.modifier_option_groups ?? []
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 border-b pb-1.5">
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
                setSelectedGroupId(category.modifier_groups[0]?.id ?? "")
              }}
            >
              {category.name}
            </ThemedButton>
          ))}
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {visibleGroups.map(({ group }) => (
            <ThemedButton
              key={group.id}
              type="button"
              size="sm"
              onClick={() => setSelectedGroupId(group.id)}
              className={
                group.id === selectedGroup?.id
                  ? "shrink-0 rounded-full"
                  : "shrink-0 rounded-full bg-muted text-foreground hover:bg-muted/80"
              }
            >
              {group.name}
            </ThemedButton>
          ))}
        </div>
      </div>

      {selectedGroup ? (
        <SubgroupRows
          group={selectedGroup}
          subgroups={subgroups}
        />
      ) : (
        <ThemedCard className="p-5 text-center">
          <p className="font-semibold">No modifier group selected</p>
        </ThemedCard>
      )}
    </div>
  )
}

function SubgroupRows({
  group,
  subgroups,
}: {
  group: RawModifierGroup
  subgroups: RawModifierOptionGroup[]
}) {
  const [activeSubgroup, setActiveSubgroup] =
    useState<RawModifierOptionGroup | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const nextSortOrder = getNextModifierOptionGroupSortOrder({
    optionGroups: subgroups,
  })

  return (
    <>
      {subgroups.length === 0 ? (
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-20 pt-3">
          <ThemedCard className="p-5 text-center">
            <p className="font-semibold">No subgroups yet</p>
          </ThemedCard>
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-20 pt-3">
          {subgroups.map((subgroup) => (
            <button
              key={subgroup.id}
              type="button"
              aria-label={`Open modifier subgroup ${subgroup.name}`}
              onClick={() => setActiveSubgroup(subgroup)}
              className={
                subgroup.is_enabled
                  ? "block w-full text-left"
                  : "block w-full text-left opacity-75"
              }
            >
              <ThemedCard
                className={
                  subgroup.is_enabled
                    ? MODIFIER_ADMIN_ROW_CARD_CLASS
                    : `${MODIFIER_ADMIN_ROW_CARD_CLASS} bg-muted/30`
                }
              >
                <CompactRecordRow
                  className={MODIFIER_ADMIN_ROW_CLASS}
                  title={subgroup.name}
                  statusIcon={
                    <CompactRecordStatusIcon enabled={subgroup.is_enabled} />
                  }
                  description={subgroup.description}
                  metadata={
                    <span>Sort {subgroup.sort_order}</span>
                  }
                />
              </ThemedCard>
            </button>
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <AdminBackButton
            fallbackHref="/admin/modifiers"
            label="Back to modifier management"
          />
          <ThemedButton
            type="button"
            size="icon"
            aria-label="Add modifier subgroup"
            className="size-10 rounded-md p-0 shadow-sm sm:size-8"
            onClick={() => setCreateOpen(true)}
          >
            <Plus aria-hidden="true" />
          </ThemedButton>
        </div>
      </div>

      <ModifierOptionGroupFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        modifierGroupId={group.id}
        modifierGroupName={group.name}
        nextSortOrder={nextSortOrder}
      />

      {activeSubgroup ? (
        <ModifierOptionGroupFormDialog
          open={Boolean(activeSubgroup)}
          onOpenChange={(open) => {
            if (!open) setActiveSubgroup(null)
          }}
          mode="edit"
          modifierGroupId={group.id}
          modifierGroupName={group.name}
          nextSortOrder={nextSortOrder}
          optionGroup={activeSubgroup}
        />
      ) : null}

    </>
  )
}
