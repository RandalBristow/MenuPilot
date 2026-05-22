"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, X } from "lucide-react"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ModifierOptionFormDialog } from "@/features/admin-modifiers/components/ModifierOptionFormDialog"
import {
  MODIFIER_ADMIN_ROW_CARD_CLASS,
  MODIFIER_ADMIN_ROW_CLASS,
} from "@/features/admin-modifiers/components/modifier-admin-row-styles"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import type {
  ModifierGroupCategory,
  RawModifierOption,
} from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

function getGroups(categories: ModifierGroupCategory[]) {
  return categories.flatMap((category) =>
    category.modifier_groups.map((group) => ({
      category,
      group,
    }))
  )
}

function formatPriceDelta(value: number | string) {
  const price = Number(value)

  if (price === 0) return "No price change"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "always",
  }).format(price)
}

export function ModifierOptionsBrowser({
  categories,
}: {
  categories: ModifierGroupCategory[]
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
  const [selectedSubgroupId, setSelectedSubgroupId] = useState("all")
  const subgroups = selectedGroup?.modifier_option_groups ?? []
  const options = (selectedGroup?.modifier_options ?? []).filter((option) => {
    if (selectedSubgroupId === "all") return true
    if (selectedSubgroupId === "ungrouped") {
      return option.modifier_option_group_id === null
    }

    return option.modifier_option_group_id === selectedSubgroupId
  })
  const [activeOption, setActiveOption] = useState<RawModifierOption | null>(
    null
  )
  const [createOpen, setCreateOpen] = useState(false)

  function handleCategoryChange(categoryId: string) {
    const nextGroup = groups.find(({ category }) => category.id === categoryId)

    setSelectedCategoryId(categoryId)
    setSelectedGroupId(nextGroup?.group.id ?? "")
    setSelectedSubgroupId("all")
  }

  if (!selectedGroup) {
    return (
      <ThemedCard className="p-5 text-center">
        <p className="font-semibold">No modifier groups yet</p>
      </ThemedCard>
    )
  }

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
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
            </ThemedButton>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Modifier group</span>
            <select
              value={selectedGroup.id}
              onChange={(event) => {
                setSelectedGroupId(event.target.value)
                setSelectedSubgroupId("all")
              }}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {visibleGroups.map(({ group }) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Subgroup</span>
            <select
              value={selectedSubgroupId}
              onChange={(event) => setSelectedSubgroupId(event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All options</option>
              <option value="ungrouped">Ungrouped</option>
              {subgroups.map((subgroup) => (
                <option key={subgroup.id} value={subgroup.id}>
                  {subgroup.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {options.length === 0 ? (
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-20 pt-3">
          <ThemedCard className="p-5 text-center">
            <p className="font-semibold">No modifiers found</p>
          </ThemedCard>
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-20 pt-3">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-label={`Open modifier ${option.name}`}
              onClick={() => setActiveOption(option)}
              className={
                option.is_enabled
                  ? "block w-full text-left"
                  : "block w-full text-left opacity-75"
              }
            >
              <ThemedCard
                className={
                  option.is_enabled
                    ? MODIFIER_ADMIN_ROW_CARD_CLASS
                    : `${MODIFIER_ADMIN_ROW_CARD_CLASS} bg-muted/30`
                }
              >
                <CompactRecordRow
                  className={MODIFIER_ADMIN_ROW_CLASS}
                  title={option.name}
                  statusIcon={
                    <CompactRecordStatusIcon enabled={option.is_enabled} />
                  }
                  description={formatPriceDelta(option.price_delta)}
                />
              </ThemedCard>
            </button>
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <ThemedButton
            asChild
            variant="outline"
            size="icon"
            aria-label="Back to modifier management"
            className="size-10 bg-background text-foreground hover:bg-muted"
          >
            <Link href="/admin/modifiers">
              <X aria-hidden="true" />
              <span className="sr-only">Back to modifier management</span>
            </Link>
          </ThemedButton>
          <ThemedButton
            type="button"
            size="icon"
            aria-label="Add modifier"
            className="size-10 rounded-md p-0 shadow-sm sm:size-8"
            onClick={() => setCreateOpen(true)}
          >
            <Plus aria-hidden="true" />
          </ThemedButton>
        </div>
      </div>

      <ModifierOptionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        modifierGroupId={selectedGroup.id}
        modifierGroupName={selectedGroup.name}
        optionGroups={subgroups}
        initialOptionGroupId={
          selectedSubgroupId === "all" || selectedSubgroupId === "ungrouped"
            ? null
            : selectedSubgroupId
        }
      />

      {activeOption ? (
        <ModifierOptionFormDialog
          open={Boolean(activeOption)}
          onOpenChange={(open) => {
            if (!open) setActiveOption(null)
          }}
          mode="edit"
          option={activeOption}
          modifierGroupId={selectedGroup.id}
          modifierGroupName={selectedGroup.name}
          optionGroups={subgroups}
        />
      ) : null}

    </div>
  )
}
