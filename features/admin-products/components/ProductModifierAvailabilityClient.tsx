"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Pencil, RotateCcw, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import {
  setProductVariantModifierOptionAvailability,
  setProductVariantModifierOptionPriceOverride,
} from "@/features/admin-products/actions/save-product-variant-modifier-option-availability"
import { isModifierOptionAvailableForVariant } from "@/features/admin-products/utils/variant-modifier-availability"
import type { ProductModifierAvailabilityData } from "@/features/admin-products/queries/get-product-modifier-availability"
import { getProductModifierGroupsHref } from "@/features/admin-products/utils/product-admin-routes"
import { getVariantModifierOptionPriceOverride } from "@/features/product-configurator/utils/variant-modifier-pricing"

type ProductModifierAvailabilityClientProps = {
  data: ProductModifierAvailabilityData
  businessSlug?: string
  writesEnabled?: boolean
}

type OptionGroupFilter = {
  id: string
  name: string
}

function formatPrice(value: number | string) {
  return Number(value).toFixed(2)
}

export function ProductModifierAvailabilityClient({
  data,
  businessSlug,
  writesEnabled = true,
}: ProductModifierAvailabilityClientProps) {
  const router = useRouter()
  const [selectedVariantOptionId, setSelectedVariantOptionId] = useState(
    data.variantGroup?.options[0]?.id ?? ""
  )
  const [editingPriceOptionId, setEditingPriceOptionId] = useState<
    string | null
  >(null)
  const [selectedOptionGroupFilterId, setSelectedOptionGroupFilterId] =
    useState("all")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const selectedVariantOption =
    data.variantGroup?.options.find(
      (option) => option.id === selectedVariantOptionId
    ) ??
    data.variantGroup?.options[0] ??
    null
  const optionGroupFilters = useMemo<OptionGroupFilter[]>(() => {
    const groupsById = new Map<string, OptionGroupFilter & { sortOrder: number }>()

    data.modifierGroup.options.forEach((option) => {
      if (!option.option_group) return

      groupsById.set(option.option_group.id, {
        id: option.option_group.id,
        name: option.option_group.name,
        sortOrder: option.option_group.sort_order,
      })
    })

    const groups = [...groupsById.values()]
      .sort((first, second) => {
        if (first.sortOrder !== second.sortOrder) {
          return first.sortOrder - second.sortOrder
        }

        return first.name.localeCompare(second.name)
      })
      .map(({ id, name }) => ({ id, name }))

    const hasUngroupedOptions = data.modifierGroup.options.some(
      (option) => !option.option_group
    )

    if (groups.length > 0 && hasUngroupedOptions) {
      groups.push({ id: "ungrouped", name: "Ungrouped" })
    }

    return groups
  }, [data.modifierGroup.options])
  const visibleOptions =
    selectedOptionGroupFilterId === "all"
      ? data.modifierGroup.options
      : data.modifierGroup.options.filter((option) =>
          selectedOptionGroupFilterId === "ungrouped"
            ? !option.option_group
            : option.option_group?.id === selectedOptionGroupFilterId
        )

  async function handleAvailabilityToggle(formData: FormData) {
    setSubmitError(null)

    try {
      await setProductVariantModifierOptionAvailability(formData)
      router.refresh()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not update modifier availability."
      )
    }
  }

  async function handlePriceOverrideSubmit(formData: FormData) {
    setSubmitError(null)

    try {
      await setProductVariantModifierOptionPriceOverride(formData)
      setEditingPriceOptionId(null)
      router.refresh()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not update modifier price."
      )
    }
  }

  function renderRuleInputs({
    optionId,
  }: {
    optionId: string
  }) {
    if (!selectedVariantOption) return null

    return (
      <>
        {businessSlug ? (
          <input type="hidden" name="businessSlug" value={businessSlug} />
        ) : null}
        <input type="hidden" name="productId" value={data.product.id} />
        <input
          type="hidden"
          name="variantGroupId"
          value={data.variantGroup?.id ?? ""}
        />
        <input
          type="hidden"
          name="variantGroupOptionId"
          value={selectedVariantOption.id}
        />
        <input
          type="hidden"
          name="modifierGroupId"
          value={data.modifierGroup.id}
        />
        <input type="hidden" name="modifierOptionId" value={optionId} />
      </>
    )
  }

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title={`${data.modifierGroup.name} Variant Rules`}
            description={data.product.name}
          />

          {data.variantGroup ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  Variant
                </span>
                <div className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto">
                  {data.variantGroup.options.map((option) => {
                    const isSelected = option.id === selectedVariantOption?.id

                    return (
                      <ThemedButton
                        key={option.id}
                        type="button"
                        size="sm"
                        onClick={() => {
                          setSelectedVariantOptionId(option.id)
                          setEditingPriceOptionId(null)
                        }}
                        className={
                          isSelected
                            ? "shrink-0"
                            : "shrink-0 border bg-background text-foreground hover:bg-muted"
                        }
                      >
                        {option.name}
                      </ThemedButton>
                    )
                  })}
                </div>
              </div>

              {optionGroupFilters.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    Show
                  </span>
                  <div className="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto">
                    {[{ id: "all", name: "All" }, ...optionGroupFilters].map(
                      (filter) => {
                        const isSelected =
                          filter.id === selectedOptionGroupFilterId

                        return (
                          <ThemedButton
                            key={filter.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOptionGroupFilterId(filter.id)}
                            className={
                              isSelected
                                ? "h-8 shrink-0 border-border bg-muted px-3 text-xs text-foreground hover:bg-muted/80"
                                : "h-8 shrink-0 border-border bg-background/70 px-3 text-xs text-muted-foreground hover:bg-muted"
                            }
                          >
                            {filter.name}
                          </ThemedButton>
                        )
                      }
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {!data.variantGroup ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No variant group assigned</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign a reusable variant group before managing variant rules.
              </p>
            </ThemedCard>
          ) : !selectedVariantOption ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No variant options available</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add enabled variant options before managing variant rules.
              </p>
            </ThemedCard>
          ) : data.modifierGroup.options.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No modifier options available</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add enabled modifier options before managing variant rules.
              </p>
            </ThemedCard>
          ) : visibleOptions.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No options in this group</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose another option group or show all options.
              </p>
            </ThemedCard>
          ) : (
            visibleOptions.map((option) => {
              const isAvailable = isModifierOptionAvailableForVariant({
                selectedVariantOptionId: selectedVariantOption.id,
                modifierGroupId: data.modifierGroup.id,
                modifierOptionId: option.id,
                availabilityRules: data.availabilityRules,
              })
              const inheritedPrice =
                option.price_delta_override ?? option.price_delta
              const priceOverride = getVariantModifierOptionPriceOverride({
                selectedVariantId: selectedVariantOption.id,
                modifierGroupId: data.modifierGroup.id,
                modifierOptionId: option.id,
                priceOverrides: data.priceOverrides,
              })
              const effectivePrice =
                priceOverride?.price_delta ?? inheritedPrice
              const isPriceOverridden = Boolean(priceOverride)
              const isEditingPrice = editingPriceOptionId === option.id

              return (
                <ThemedCard key={option.id} className="overflow-hidden p-0">
                  <div className="space-y-2 px-3 py-2.5">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <CompactRecordStatusIcon
                            enabled={isAvailable}
                            enabledLabel="Available for this variant"
                            disabledLabel="Unavailable for this variant"
                          />
                          <p className="min-w-0 truncate text-sm font-semibold">
                            {option.name}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${formatPrice(effectivePrice)} -{" "}
                          {isPriceOverridden ? "Overridden" : "Inherited"}
                        </p>
                      </div>

                      <form
                        action={
                          writesEnabled ? handleAvailabilityToggle : undefined
                        }
                        className="shrink-0"
                      >
                        {renderRuleInputs({ optionId: option.id })}
                        <input
                          type="hidden"
                          name="isAvailable"
                          value={String(!isAvailable)}
                        />
                        <ThemedButton
                          type="submit"
                          disabled={!writesEnabled}
                          size="icon"
                          variant="outline"
                          aria-label={
                            isAvailable
                              ? "Make unavailable for this variant"
                              : "Make available for this variant"
                          }
                          className="size-9 bg-background text-foreground hover:bg-muted"
                        >
                          {isAvailable ? (
                            <ThumbsUp aria-hidden="true" />
                          ) : (
                            <ThumbsDown aria-hidden="true" />
                          )}
                        </ThemedButton>
                      </form>
                    </div>

                    {isEditingPrice ? (
                      <form
                        action={
                          writesEnabled ? handlePriceOverrideSubmit : undefined
                        }
                        className="flex items-end gap-2"
                      >
                        {renderRuleInputs({ optionId: option.id })}
                        <label className="grid min-w-0 flex-1 gap-1">
                          <span className="text-xs font-medium">
                            Price for {selectedVariantOption.name}
                          </span>
                          <input
                            name="priceDelta"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={formatPrice(effectivePrice)}
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                          />
                        </label>
                        <ThemedButton
                          type="submit"
                          disabled={!writesEnabled}
                          size="icon"
                          aria-label="Save price override"
                          className="size-9"
                        >
                          <Check aria-hidden="true" />
                        </ThemedButton>
                        <ThemedButton
                          type="button"
                          size="icon"
                          variant="outline"
                          aria-label="Cancel price edit"
                          className="size-9 bg-background text-foreground hover:bg-muted"
                          onClick={() => setEditingPriceOptionId(null)}
                        >
                          <X aria-hidden="true" />
                        </ThemedButton>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Inherited price: ${formatPrice(inheritedPrice)}
                        </p>
                        <div className="ml-auto flex items-center gap-1.5">
                          {isPriceOverridden ? (
                            <form
                              action={
                                writesEnabled
                                  ? handlePriceOverrideSubmit
                                  : undefined
                              }
                            >
                              {renderRuleInputs({ optionId: option.id })}
                              <input type="hidden" name="priceDelta" value="" />
                              <ThemedButton
                                type="submit"
                                disabled={!writesEnabled}
                                size="icon"
                                variant="outline"
                                aria-label="Clear price override"
                                className="size-9 bg-background text-foreground hover:bg-muted"
                              >
                                <RotateCcw aria-hidden="true" />
                              </ThemedButton>
                            </form>
                          ) : null}
                          <ThemedButton
                            type="button"
                            size="icon"
                            variant="outline"
                            aria-label="Edit price override"
                            className="size-9 bg-background text-foreground hover:bg-muted"
                            onClick={() => setEditingPriceOptionId(option.id)}
                          >
                            <Pencil aria-hidden="true" />
                          </ThemedButton>
                        </div>
                      </div>
                    )}
                  </div>
                </ThemedCard>
              )
            })
          )}

          {submitError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end">
            <AdminBackButton
              fallbackHref={getProductModifierGroupsHref(
                data.product.id,
                businessSlug
              )}
              label="Back to modifier assignments"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
