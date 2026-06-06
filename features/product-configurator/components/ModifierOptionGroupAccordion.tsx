"use client"

import { Check } from "lucide-react"
import {
  ThemedAccordion,
  type ThemedAccordionItem,
} from "@/components/themed/ThemedAccordion"
import { cn } from "@/lib/utils"
import { groupModifierOptionsByOptionGroup } from "@/features/product-configurator/utils/group-modifier-options-by-option-group"

type Placement = "left" | "whole" | "right"

export type ModifierOptionGroupAccordionSelectedModifier = {
  optionId: string
  placement: Placement
  multiplier: number
}

export type ModifierOptionGroupAccordionOptionGroup = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  sort_order: number
}

export type ModifierOptionGroupAccordionOption = {
  id: string
  name: string
  price_delta: number
  is_enabled: boolean
  sort_order: number
  modifier_option_group_id: string | null
  modifier_option_groups: ModifierOptionGroupAccordionOptionGroup | null
}

export type ModifierOptionGroupAccordionModifierGroup<
  TOption extends ModifierOptionGroupAccordionOption =
    ModifierOptionGroupAccordionOption,
> = {
  id: string
  supports_placement: boolean
  supports_multiplier: boolean
  min_multiplier: number
  max_multiplier: number
  multiplier_step: number
  modifier_options: TOption[]
}

type PlacementLabel = readonly [Placement, string]

type ModifierOptionGroupAccordionProps<
  TOption extends ModifierOptionGroupAccordionOption,
  TGroup extends ModifierOptionGroupAccordionModifierGroup<TOption>,
> = {
  group: TGroup
  selectedModifiers: Record<string, ModifierOptionGroupAccordionSelectedModifier>
  getDisplayPriceDelta: (option: TOption) => number
  getSelectedMeta?: (options: TOption[]) => string | undefined
  onToggleOption: (option: TOption) => void
  onUpdateModifier: (
    optionId: string,
    updates: Partial<ModifierOptionGroupAccordionSelectedModifier>
  ) => void
  placementLabels?: readonly PlacementLabel[]
  getMultiplierOptions?: (group: TGroup) => number[]
  showZeroPrices?: boolean
  compact?: boolean
}

const defaultPlacementLabels = [
  ["left", "Left side"],
  ["whole", "Whole item"],
  ["right", "Right side"],
] as const

function PlacementIcon({ placement }: { placement: Placement }) {
  if (placement === "whole") {
    return (
      <span className="block size-4 rounded-full border border-current bg-current" />
    )
  }

  return (
    <span className="relative block size-4 overflow-hidden rounded-full border border-current">
      <span
        className={cn(
          "absolute inset-y-0 w-1/2 bg-current",
          placement === "left" ? "left-0" : "right-0"
        )}
      />
    </span>
  )
}

function getDefaultMultiplierOptions(
  group: ModifierOptionGroupAccordionModifierGroup
) {
  const min = Math.max(1, Number(group.min_multiplier) || 1)
  const max = Math.max(min, Number(group.max_multiplier) || min)
  const step = Math.max(1, Number(group.multiplier_step) || 1)
  const values: number[] = []

  for (let value = min; value <= max; value += step) {
    values.push(value)
  }

  return values
}

function getSectionId(optionGroupId: string | null) {
  return optionGroupId ?? "ungrouped"
}

function getSelectedCount<TOption extends ModifierOptionGroupAccordionOption>(
  options: TOption[],
  selectedModifiers: Record<string, ModifierOptionGroupAccordionSelectedModifier>
) {
  return options.filter((option) => selectedModifiers[option.id]).length
}

export function ModifierOptionGroupAccordion<
  TOption extends ModifierOptionGroupAccordionOption,
  TGroup extends ModifierOptionGroupAccordionModifierGroup<TOption>,
>({
  group,
  selectedModifiers,
  getDisplayPriceDelta,
  getSelectedMeta,
  onToggleOption,
  onUpdateModifier,
  placementLabels = defaultPlacementLabels,
  getMultiplierOptions,
  showZeroPrices = false,
  compact = true,
}: ModifierOptionGroupAccordionProps<TOption, TGroup>) {
  const optionSections = groupModifierOptionsByOptionGroup<TOption>(
    group.modifier_options ?? []
  )
  const selectedSectionIds = optionSections
    .filter((section) => getSelectedCount(section.options, selectedModifiers) > 0)
    .map((section) => getSectionId(section.optionGroup?.id ?? null))
  const defaultOpenIds =
    selectedSectionIds.length > 0
      ? selectedSectionIds
      : optionSections[0]
        ? [getSectionId(optionSections[0].optionGroup?.id ?? null)]
        : []

  const accordionItems: ThemedAccordionItem[] = optionSections.map((section) => {
    const selectedCount = getSelectedCount(section.options, selectedModifiers)
    const selectedMeta = getSelectedMeta?.(section.options)
    const title = section.optionGroup?.name ?? "Other"
    const subtitle = section.optionGroup?.description

    return {
      id: getSectionId(section.optionGroup?.id ?? null),
      title,
      subtitle,
      meta:
        selectedMeta ??
        (selectedCount > 0 ? `${selectedCount} selected` : undefined),
      content: (
        <div className="space-y-1.5">
          {section.options.map((option) => {
            const selected = selectedModifiers[option.id]
            const displayPriceDelta = getDisplayPriceDelta(option)
            const showPrice = showZeroPrices || displayPriceDelta > 0

            return (
              <div
                key={option.id}
                aria-selected={selected ? "true" : "false"}
                className={cn(
                  "rounded-md border px-3 py-2",
                  selected ? "border-accent bg-accent/20" : "border-border"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    aria-pressed={selected ? "true" : "false"}
                    onClick={() => onToggleOption(option)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium"
                  >
                    <Check
                      aria-hidden="true"
                      className={cn(
                        "size-5 shrink-0",
                        selected
                          ? "text-accent-foreground"
                          : "text-transparent"
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.name}
                    </span>
                  </button>

                  {showPrice ? (
                    <span className="shrink-0 text-sm font-semibold">
                      +${displayPriceDelta.toFixed(2)}
                    </span>
                  ) : null}
                </div>

                {selected &&
                (group.supports_placement || group.supports_multiplier) ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {group.supports_placement ? (
                      <div className="flex min-w-[7.5rem] flex-1 items-center gap-1.5">
                        {placementLabels.map(([placement, label]) => (
                          <button
                            key={placement}
                            type="button"
                            aria-label={`Set ${option.name} placement to ${label}`}
                            title={label}
                            onClick={() =>
                              onUpdateModifier(option.id, { placement })
                            }
                            className={cn(
                              "flex size-9 items-center justify-center rounded-md border",
                              selected.placement === placement
                                ? "border-accent bg-accent text-accent-foreground"
                                : "bg-card"
                            )}
                          >
                            <PlacementIcon placement={placement} />
                            <span className="sr-only">{label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {group.supports_multiplier ? (
                      <select
                        aria-label={`Amount for ${option.name}`}
                        value={selected.multiplier}
                        onChange={(event) =>
                          onUpdateModifier(option.id, {
                            multiplier: Number(event.target.value),
                          })
                        }
                        className="h-9 w-20 shrink-0 rounded-md border bg-background px-2 text-sm"
                      >
                        {(getMultiplierOptions ?? getDefaultMultiplierOptions)(
                          group
                        ).map((amount) => (
                          <option key={amount} value={amount}>
                            {amount}x
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ),
    }
  })

  if (accordionItems.length === 0) return null

  return (
    <ThemedAccordion
      items={accordionItems}
      defaultOpenIds={defaultOpenIds}
      compact={compact}
    />
  )
}
