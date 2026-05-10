"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { setModifierGroupEnabled } from "@/features/admin-modifiers/actions/set-modifier-group-enabled"
import { setModifierOptionGroupEnabled } from "@/features/admin-modifiers/actions/set-modifier-option-group-enabled"
import { setModifierOptionEnabled } from "@/features/admin-modifiers/actions/set-modifier-option-enabled"
import { ModifierGroupFormDialog } from "@/features/admin-modifiers/components/ModifierGroupFormDialog"
import { ModifierOptionFormDialog } from "@/features/admin-modifiers/components/ModifierOptionFormDialog"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"

export type RawModifierOptionGroup = {
  id: string
  name: string
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

type ModifierOptionGroup = {
  id: string
  name: string
  isEnabled: boolean
  options: RawModifierOption[]
}

type ModifiersCategoryBrowserProps = {
  categories: ModifierGroupCategory[]
}

type ActiveOptionGroup = {
  id: string
  name: string
  optionGroups: RawModifierOptionGroup[]
  initialOptionGroupId?: string | null
}

type ActiveOptionDialog = {
  mode: "create" | "edit"
  group: ActiveOptionGroup
  option?: RawModifierOption
}

function formatSelectionType(value: string) {
  return value.replaceAll("_", " ")
}

function formatGroupRules(group: RawModifierGroup) {
  const maxAllowed = group.max_allowed ?? "No max"
  const requiredLabel = group.is_required ? "Required" : "Optional"
  const selectionLabel = formatSelectionType(group.selection_type)

  return `${requiredLabel} • ${selectionLabel} • min ${group.min_required} • max ${maxAllowed}`
}

function formatPriceDelta(value: number | string) {
  const price = Number(value)

  if (price === 0) return null

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "always",
  }).format(price)
}

function sortBySortOrder<T extends { sort_order: number; name: string }>(
  items: T[]
) {
  return [...items].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}

function getOptionGroups(group: RawModifierGroup) {
  const subgroups = sortBySortOrder(group.modifier_option_groups ?? [])
  const options = sortBySortOrder(group.modifier_options ?? [])

  const groupedOptions: ModifierOptionGroup[] = subgroups.map((subgroup) => ({
    id: subgroup.id,
    name: subgroup.name,
    isEnabled: subgroup.is_enabled,
    options: options.filter(
      (option) => option.modifier_option_group_id === subgroup.id
    ),
  }))

  const ungroupedOptions = options.filter(
    (option) => option.modifier_option_group_id === null
  )

  groupedOptions.push({
    id: "ungrouped",
    name: "Ungrouped options",
    isEnabled: true,
    options: ungroupedOptions,
  })

  return groupedOptions
}

function getOptionCount(group: RawModifierGroup) {
  return group.modifier_options?.length ?? 0
}

function getCategoryOptionCount(category: ModifierGroupCategory) {
  return category.modifier_groups.reduce(
    (total, group) => total + getOptionCount(group),
    0
  )
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "muted"
}) {
  return (
    <span
      className={
        tone === "muted"
          ? "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
          : "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary"
      }
    >
      {children}
    </span>
  )
}

function OptionList({
  options,
  modifierGroupId,
  onEditOption,
}: {
  options: RawModifierOption[]
  modifierGroupId: string
  onEditOption: (option: RawModifierOption) => void
}) {
  const router = useRouter()

  async function handleEnabledChange(option: RawModifierOption) {
    const formData = new FormData()
    formData.set("optionId", option.id)
    formData.set("modifierGroupId", modifierGroupId)
    formData.set("isEnabled", String(!option.is_enabled))

    await setModifierOptionEnabled(formData)
    router.refresh()
  }

  if (options.length === 0) {
    return (
      <p className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        No options in this subgroup yet.
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      {options.map((option) => (
        <div
          key={option.id}
          className={
            option.is_enabled
              ? "flex min-h-10 flex-col gap-2 rounded-md border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              : "flex min-h-10 flex-col gap-2 rounded-md border bg-muted/30 px-3 py-2 opacity-70 sm:flex-row sm:items-center sm:justify-between"
          }
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 text-sm font-medium">{option.name}</p>
            {formatPriceDelta(option.price_delta) ? (
              <StatusPill tone="muted">
                {formatPriceDelta(option.price_delta)}
              </StatusPill>
            ) : null}
            {!option.is_enabled ? (
              <StatusPill tone="muted">Disabled</StatusPill>
            ) : null}
          </div>

          <div className="flex gap-2">
            <ThemedButton
              type="button"
              variant="outline"
              className="h-8 flex-1 bg-background px-3 text-foreground hover:bg-muted sm:flex-none"
              onClick={() => onEditOption(option)}
            >
              Edit
            </ThemedButton>
            <ThemedButton
              type="button"
              variant={option.is_enabled ? "outline" : "default"}
              className={
                option.is_enabled
                  ? "h-8 flex-1 bg-background px-3 text-foreground hover:bg-muted sm:flex-none"
                  : "h-8 flex-1 px-3 sm:flex-none"
              }
              onClick={() => void handleEnabledChange(option)}
            >
              {option.is_enabled ? "Disable" : "Enable"}
            </ThemedButton>
          </div>
        </div>
      ))}
    </div>
  )
}

function ModifierGroupCard({
  group,
  onAddOption,
  onEditOption,
}: {
  group: RawModifierGroup
  onAddOption: (group: ActiveOptionGroup) => void
  onEditOption: (group: ActiveOptionGroup, option: RawModifierOption) => void
}) {
  const router = useRouter()
  const optionGroups = getOptionGroups(group)
  const sortedOptionGroups = sortBySortOrder(group.modifier_option_groups ?? [])

  async function handleEnabledChange() {
    const formData = new FormData()
    formData.set("modifierGroupId", group.id)
    formData.set("isEnabled", String(!group.is_enabled))

    await setModifierGroupEnabled(formData)
    router.refresh()
  }

  async function handleOptionGroupEnabledChange(
    optionGroup: ModifierOptionGroup
  ) {
    if (optionGroup.id === "ungrouped") return

    const formData = new FormData()
    formData.set("modifierGroupId", group.id)
    formData.set("modifierOptionGroupId", optionGroup.id)
    formData.set("isEnabled", String(!optionGroup.isEnabled))

    await setModifierOptionGroupEnabled(formData)
    router.refresh()
  }

  return (
    <ThemedCard
      className={
        group.is_enabled
          ? "overflow-hidden"
          : "overflow-hidden bg-muted/30 opacity-75"
      }
    >
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-3 marker:hidden sm:flex-row sm:items-center sm:justify-between sm:px-5 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-sm text-muted-foreground transition-transform group-open:rotate-90">
                &gt;
              </span>
              <h2 className="truncate text-base font-semibold sm:text-lg">
                {group.name}
              </h2>
              {!group.is_enabled ? (
                <StatusPill tone="muted">Disabled</StatusPill>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatGroupRules(group)} - {getOptionCount(group)} options
            </p>
          </div>

          <ThemedButton
            type="button"
            variant={group.is_enabled ? "outline" : "default"}
            className={
              group.is_enabled
                ? "w-full bg-background text-foreground hover:bg-muted sm:w-auto"
                : "w-full sm:w-auto"
            }
            onClick={(event) => {
              event.preventDefault()
              void handleEnabledChange()
            }}
          >
            {group.is_enabled ? "Disable" : "Enable"}
          </ThemedButton>
        </summary>

        <div className="space-y-3 border-t px-4 py-4 sm:px-5">
          <div className="space-y-3">
            {optionGroups.length === 0 ? (
              <p className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                No modifier options yet.
              </p>
            ) : (
              optionGroups.map((optionGroup) => (
                <section
                  key={optionGroup.id}
                  className={
                    optionGroup.isEnabled
                      ? "space-y-2"
                      : "space-y-2 rounded-md bg-muted/30 p-2 opacity-75"
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">
                        {optionGroup.name}
                      </h3>
                      {!optionGroup.isEnabled ? (
                        <StatusPill tone="muted">Disabled</StatusPill>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {optionGroup.id !== "ungrouped" ? (
                        <ThemedButton
                          type="button"
                          variant={optionGroup.isEnabled ? "outline" : "default"}
                          className={
                            optionGroup.isEnabled
                              ? "h-8 bg-background px-3 text-foreground hover:bg-muted"
                              : "h-8 px-3"
                          }
                          onClick={() =>
                            void handleOptionGroupEnabledChange(optionGroup)
                          }
                        >
                          {optionGroup.isEnabled ? "Disable" : "Enable"}
                        </ThemedButton>
                      ) : null}

                      <ThemedButton
                        type="button"
                        aria-label={`Add option to ${optionGroup.name}`}
                        title={`Add option to ${optionGroup.name}`}
                        className="h-8 w-8 shrink-0 p-0"
                        onClick={() =>
                          onAddOption({
                            id: group.id,
                            name: group.name,
                            optionGroups: sortedOptionGroups,
                            initialOptionGroupId:
                              optionGroup.id === "ungrouped"
                                ? null
                                : optionGroup.id,
                          })
                        }
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </ThemedButton>
                    </div>
                  </div>

                  <OptionList
                    options={optionGroup.options}
                    modifierGroupId={group.id}
                    onEditOption={(option) =>
                      onEditOption(
                        {
                          id: group.id,
                          name: group.name,
                          optionGroups: sortedOptionGroups,
                        },
                        option
                      )
                    }
                  />
                </section>
              ))
            )}
          </div>
        </div>
      </details>
    </ThemedCard>
  )
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
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className={
            selectedCategoryId === category.id
              ? "snap-start whitespace-nowrap rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              : "snap-start whitespace-nowrap rounded-full border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          }
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}

export function ModifiersCategoryBrowser({
  categories,
}: ModifiersCategoryBrowserProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id ?? null
  )
  const [activeOptionDialog, setActiveOptionDialog] =
    useState<ActiveOptionDialog | null>(null)
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
    <div className="space-y-4">
      <CategoryFilter
        categories={categories}
        selectedCategoryId={selectedCategory.id}
        onSelectCategory={setSelectedCategoryId}
      />

      <section className="space-y-3">
        <div className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{selectedCategory.name}</h2>
            {selectedCategory.description ? (
              <p className="text-sm text-muted-foreground">
                {selectedCategory.description}
              </p>
            ) : null}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {selectedCategory.modifier_groups.length} groups -{" "}
            {getCategoryOptionCount(selectedCategory)} options
          </p>
          <ModifierGroupFormDialog
            categories={categories}
            selectedCategoryId={selectedCategory.id}
            onCreated={setSelectedCategoryId}
          />
        </div>

        {selectedCategory.modifier_groups.length === 0 ? (
          <ThemedCard className="p-5 text-center">
            <p className="font-semibold">No modifier groups in this category</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Assigned modifier groups will appear here.
            </p>
          </ThemedCard>
        ) : (
          <div className="space-y-2">
            {selectedCategory.modifier_groups.map((group) => (
              <ModifierGroupCard
                key={group.id}
                group={group}
                onAddOption={(activeGroup) =>
                  setActiveOptionDialog({
                    mode: "create",
                    group: activeGroup,
                  })
                }
                onEditOption={(activeGroup, option) =>
                  setActiveOptionDialog({
                    mode: "edit",
                    group: activeGroup,
                    option,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {activeOptionDialog ? (
        <ModifierOptionFormDialog
          open={Boolean(activeOptionDialog)}
          onOpenChange={(open) => {
            if (!open) {
              setActiveOptionDialog(null)
            }
          }}
          mode={activeOptionDialog.mode}
          option={activeOptionDialog.option}
          modifierGroupId={activeOptionDialog.group.id}
          modifierGroupName={activeOptionDialog.group.name}
          optionGroups={activeOptionDialog.group.optionGroups}
          initialOptionGroupId={activeOptionDialog.group.initialOptionGroupId}
        />
      ) : null}
    </div>
  )
}
