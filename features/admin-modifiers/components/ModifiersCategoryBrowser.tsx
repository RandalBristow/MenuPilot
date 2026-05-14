"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { useState } from "react"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ModifierGroupFormDialog } from "@/features/admin-modifiers/components/ModifierGroupFormDialog"
import {
  MODIFIER_ADMIN_ROW_CARD_CLASS,
  MODIFIER_ADMIN_ROW_CLASS,
} from "@/features/admin-modifiers/components/modifier-admin-row-styles"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"

export type RawModifierOptionGroup = {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_enabled: boolean
}

export type RawModifierOption = {
  id: string
  name: string
  price_delta: number | string
  modifier_option_group_id: string | null
  sort_order: number
  is_enabled: boolean
}

export type RawModifierGroup = {
  id: string
  name: string
  selection_type: string
  min_required: number
  max_allowed: number | null
  is_required: boolean
  is_enabled: boolean
  sort_order: number
  modifier_option_groups: RawModifierOptionGroup[] | null
  modifier_options: RawModifierOption[] | null
}

export type ModifierGroupCategory = {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_enabled: boolean
  modifier_groups: RawModifierGroup[]
}

type ModifiersCategoryBrowserProps = {
  categories: ModifierGroupCategory[]
}

function formatSelectionType(value: string) {
  return value.replaceAll("_", " ")
}

function formatGroupRules(group: RawModifierGroup) {
  const maxAllowed = group.max_allowed ?? "No max"
  const requiredLabel = group.is_required ? "Required" : "Optional"
  const selectionLabel = formatSelectionType(group.selection_type)

  return `${requiredLabel} - ${selectionLabel} - min ${group.min_required} - max ${maxAllowed}`
}

function getOptionCount(group: RawModifierGroup) {
  return group.modifier_options?.length ?? 0
}

function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: {
  categories: ModifierGroupCategory[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string) => void
}) {
  return (
    <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth">
      {categories.map((category) => (
        <ThemedButton
          key={category.id}
          type="button"
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className={
            selectedCategoryId === category.id
              ? "snap-start shrink-0 whitespace-nowrap rounded-full"
              : "snap-start shrink-0 whitespace-nowrap rounded-full border bg-background text-foreground hover:bg-muted"
          }
        >
          {category.name}
        </ThemedButton>
      ))}
    </div>
  )
}

function ModifierGroupCard({
  group,
}: {
  group: RawModifierGroup
}) {
  return (
    <Link
      href={`/admin/modifiers/${group.id}`}
      aria-label={`Open modifier group ${group.name}`}
      className={group.is_enabled ? "block" : "block opacity-75"}
    >
      <ThemedCard
        className={
          group.is_enabled
            ? MODIFIER_ADMIN_ROW_CARD_CLASS
            : `${MODIFIER_ADMIN_ROW_CARD_CLASS} bg-muted/30`
        }
      >
        <CompactRecordRow
          className={MODIFIER_ADMIN_ROW_CLASS}
          title={group.name}
          statusIcon={<CompactRecordStatusIcon enabled={group.is_enabled} />}
          description={`${formatGroupRules(group)} - ${getOptionCount(group)} options`}
        />
      </ThemedCard>
    </Link>
  )
}

export function ModifiersCategoryBrowser({
  categories,
}: ModifiersCategoryBrowserProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id ?? null
  )
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ??
    categories[0] ??
    null

  if (!selectedCategory) {
    return (
      <ThemedCard className="p-6 text-center">
        <p className="font-semibold">No modifier categories yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Modifier categories will appear here after they are configured.
        </p>
      </ThemedCard>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b pb-1.5">
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategory.id}
          onSelectCategory={setSelectedCategoryId}
        />
      </div>

      <section className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-20 pt-3">
        {selectedCategory.modifier_groups.length === 0 ? (
          <ThemedCard className="p-5 text-center">
            <p className="font-semibold">No modifier groups in this category</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a group to define product-attached modifier rules.
            </p>
          </ThemedCard>
        ) : (
          <div className="space-y-2">
            {selectedCategory.modifier_groups.map((group) => (
              <ModifierGroupCard
                key={group.id}
                group={group}
              />
            ))}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end">
          <ModifierGroupFormDialog
            categories={categories}
            selectedCategoryId={selectedCategory.id}
            triggerIcon={<Plus aria-hidden="true" />}
            triggerAriaLabel="Add modifier group"
            onCreated={setSelectedCategoryId}
          />
        </div>
      </div>
    </div>
  )
}
