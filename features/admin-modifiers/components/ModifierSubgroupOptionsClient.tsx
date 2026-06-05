"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Pencil, Plus, Star, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import { saveProductModifierOptionOverride } from "@/features/admin-modifiers/actions/save-product-modifier-option-override"
import { setProductDefaultModifierOption } from "@/features/admin-products/actions/save-product-default-modifier-option"
import type { DeleteModifierOptionResult } from "@/features/admin-modifiers/actions/delete-modifier-option"
import { DeleteModifierOptionButton } from "@/features/admin-modifiers/components/DeleteModifierOptionButton"
import { ModifierOptionFormDialog } from "@/features/admin-modifiers/components/ModifierOptionFormDialog"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import {
  getNextModifierOptionSortOrder,
  sortModifierOptionsWithinList,
} from "@/features/admin-modifiers/utils/modifier-option-sort-order"
import { getModifierGroupHref } from "@/features/admin-modifiers/utils/modifier-admin-routes"
import type {
  ModifierGroupDetail,
  ModifierGroupDetailOption,
  ModifierGroupProductContext,
  ModifierGroupDetailSubgroup,
} from "@/features/admin-modifiers/queries/get-modifier-group-detail"

type ModifierSubgroupOptionsClientProps = {
  businessSlug?: string
  data: {
    businessName: string
    mode: "global" | "product" | "preview"
    group: ModifierGroupDetail
    productContext: ModifierGroupProductContext
  }
  subgroup: ModifierGroupDetailSubgroup
}

function formatPriceDelta(value: number) {
  if (value === 0) return "No price change"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "always",
  }).format(value)
}

function getNullableSelectValue(value: boolean | null | undefined) {
  if (value === true) return "true"
  if (value === false) return "false"

  return "inherit"
}

function getEffectiveOption(option: ModifierGroupDetailOption) {
  return {
    priceDelta: option.override?.price_delta_override ?? option.price_delta,
    priceSource:
      option.override?.price_delta_override === null ||
      option.override?.price_delta_override === undefined
        ? "Inherited"
        : "Overridden",
    isEnabled: option.override?.is_enabled ?? option.is_enabled,
  }
}

function OverrideStatusControl({
  defaultValue,
}: {
  defaultValue: string
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Status</legend>
      <div className="grid grid-cols-3 overflow-hidden rounded-md border bg-background p-1">
        {[
          { value: "inherit", label: "Inherit" },
          {
            value: "true",
            label: (
              <>
                <ThumbsUp aria-hidden="true" className="size-4" />
                <span className="sr-only">Enabled</span>
              </>
            ),
            ariaLabel: "Enabled",
          },
          {
            value: "false",
            label: (
              <>
                <ThumbsDown aria-hidden="true" className="size-4" />
                <span className="sr-only">Disabled</span>
              </>
            ),
            ariaLabel: "Disabled",
          },
        ].map((option) => (
          <label key={option.value} className="min-w-0">
            <input
              type="radio"
              name="isEnabled"
              value={option.value}
              aria-label={option.ariaLabel}
              defaultChecked={defaultValue === option.value}
              className="peer sr-only"
            />
            <span className="flex h-8 items-center justify-center gap-1 truncate rounded-sm px-2 text-center text-xs text-muted-foreground transition-colors peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function getOptionDescription(
  option: ModifierGroupDetailOption,
  productContext: ModifierGroupProductContext
) {
  if (!productContext) return option.description

  const effective = getEffectiveOption(option)

  return `${formatPriceDelta(effective.priceDelta)} - ${effective.priceSource}`
}

function ModifierOptionOverridePanel({
  businessSlug,
  open,
  onOpenChange,
  group,
  productContext,
  option,
}: {
  businessSlug?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  group: ModifierGroupDetail
  productContext: NonNullable<ModifierGroupProductContext>
  option: ModifierGroupDetailOption | null
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  if (!option) return null

  async function handleSubmit(formData: FormData) {
    await saveProductModifierOptionOverride(formData)
    formRef.current?.reset()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <ThemedSheet open={open} onOpenChange={onOpenChange}>
      <ThemedSheetContent
        side="bottom"
        showCloseButton={false}
        className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
      >
        <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
          <ThemedSheetTitle>{option.name}</ThemedSheetTitle>
          <ThemedSheetDescription>
            Override this default option for {productContext.name}.
          </ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          key={option.id}
          ref={formRef}
          action={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={`${PRODUCT_ADMIN_PANEL_BODY_CLASS} pb-4`}>
            <input type="hidden" name="productId" value={productContext.id} />
            {businessSlug ? (
              <input type="hidden" name="businessSlug" value={businessSlug} />
            ) : null}
            <input type="hidden" name="modifierGroupId" value={group.id} />
            <input type="hidden" name="modifierOptionId" value={option.id} />

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Price override</span>
                <input
                  name="priceDeltaOverride"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={String(option.price_delta)}
                  defaultValue={option.override?.price_delta_override ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <OverrideStatusControl
                  defaultValue={getNullableSelectValue(
                    option.override?.is_enabled
                  )}
                />

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Sort order</span>
                  <input
                    name="sortOrder"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={String(option.sort_order)}
                    defaultValue={option.override?.sort_order ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Prep time</span>
                <input
                  name="prepTimeDeltaMinutesOverride"
                  type="number"
                  min="0"
                  step="1"
                  placeholder={String(option.prep_time_delta_minutes)}
                  defaultValue={
                    option.override?.prep_time_delta_minutes_override ?? ""
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>
            </div>
          </div>

          <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Close</span>
            </ThemedButton>
            <ThemedButton
              type="submit"
              size="icon"
              aria-label="Save override"
              className="size-10"
            >
              <Check aria-hidden="true" />
              <span className="sr-only">Save override</span>
            </ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}

export function ModifierSubgroupOptionsClient({
  businessSlug,
  data,
  subgroup,
}: ModifierSubgroupOptionsClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteResult, setDeleteResult] =
    useState<DeleteModifierOptionResult | null>(null)
  const [activeOption, setActiveOption] =
    useState<ModifierGroupDetailOption | null>(null)
  const { group, mode, productContext } = data
  const isProductScopedMode = mode !== "global"
  const options = sortModifierOptionsWithinList(
    group.options.filter(
      (option) => option.modifier_option_group_id === subgroup.id
    )
  )
  const nextSortOrdersByOptionGroupId = Object.fromEntries(
    group.optionGroups.map((optionGroup) => [
      optionGroup.id,
      getNextModifierOptionSortOrder({
        options: group.options,
        modifierOptionGroupId: optionGroup.id,
      }),
    ])
  )
  const ungroupedNextSortOrder = getNextModifierOptionSortOrder({
    options: group.options,
    modifierOptionGroupId: null,
  })

  async function handleDefaultToggle(formData: FormData) {
    await setProductDefaultModifierOption(formData)
  }

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title={`${subgroup.name} Options`}
            description={
              productContext
                ? `Product-specific options for ${productContext.name}.`
                : `Options inside ${subgroup.name}.`
            }
          />
          {mode === "product" ? (
            <p className="text-xs text-muted-foreground">
              Changes here only affect {productContext?.name}; default modifier
              lists stay unchanged.
            </p>
          ) : null}
          {mode === "preview" ? (
            <p className="text-xs text-muted-foreground">
              This group is not assigned to this product. Options are read-only
              here.
            </p>
          ) : null}
          {deleteResult ? (
            <p
              className={
                deleteResult.status === "deleted"
                  ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
                  : "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              }
            >
              {deleteResult.message}
            </p>
          ) : null}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {options.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No options yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add options for this subgroup.
              </p>
            </ThemedCard>
          ) : (
            options.map((option) => {
              const isDefault = option.defaultSelection?.is_enabled === true

              return (
                <ThemedCard
                  key={option.id}
                  role={mode === "preview" ? undefined : "button"}
                  tabIndex={mode === "preview" ? undefined : 0}
                  aria-label={`Edit option ${option.name}`}
                  onClick={() => {
                    if (mode !== "preview") setActiveOption(option)
                  }}
                  onKeyDown={(event) => {
                    if (
                      mode !== "preview" &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault()
                      setActiveOption(option)
                    }
                  }}
                  className={
                    getEffectiveOption(option).isEnabled
                      ? "cursor-pointer overflow-hidden py-0"
                      : "cursor-pointer overflow-hidden bg-muted/30 py-0 opacity-75"
                  }
                >
                  <CompactRecordRow
                    title={option.name}
                    statusIcon={
                      <CompactRecordStatusIcon
                        enabled={getEffectiveOption(option).isEnabled}
                      />
                    }
                    description={getOptionDescription(option, productContext)}
                    rightAction={
                      productContext && mode === "product" ? (
                        <form
                          action={handleDefaultToggle}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {businessSlug ? (
                            <input
                              type="hidden"
                              name="businessSlug"
                              value={businessSlug}
                            />
                          ) : null}
                          <input
                            type="hidden"
                            name="productId"
                            value={productContext.id}
                          />
                          <input
                            type="hidden"
                            name="modifierGroupId"
                            value={group.id}
                          />
                          <input
                            type="hidden"
                            name="modifierOptionId"
                            value={option.id}
                          />
                          <input
                            type="hidden"
                            name="isDefault"
                            value={String(!isDefault)}
                          />
                          <ThemedButton
                            type="submit"
                            size="icon"
                            variant="outline"
                            aria-label={
                              isDefault
                                ? `Remove ${option.name} as default`
                                : `Make ${option.name} default`
                            }
                            className={
                              isDefault
                                ? "size-8 bg-foreground text-background hover:bg-foreground/90"
                                : "size-8 bg-background text-foreground hover:bg-muted"
                            }
                          >
                            <Star
                              aria-hidden="true"
                              className={isDefault ? "fill-current" : ""}
                            />
                          </ThemedButton>
                        </form>
                      ) : mode === "global" ? (
                        <>
                          <ThemedButton
                            type="button"
                            size="icon"
                            variant="outline"
                            aria-label={`Edit or move modifier option ${option.name}`}
                            className="size-8 bg-background text-foreground hover:bg-muted"
                            onClick={(event) => {
                              event.stopPropagation()
                              setActiveOption(option)
                            }}
                          >
                            <Pencil aria-hidden="true" />
                            <span className="sr-only">
                              Edit or move modifier option
                            </span>
                          </ThemedButton>
                          <DeleteModifierOptionButton
                            businessSlug={businessSlug}
                            optionId={option.id}
                            optionName={option.name}
                            modifierGroupId={group.id}
                            onResult={setDeleteResult}
                          />
                        </>
                      ) : undefined
                    }
                    metadata={
                      productContext ? undefined : (
                        <>
                          <span>{formatPriceDelta(option.price_delta)}</span>
                          <span>Sort {option.sort_order}</span>
                        </>
                      )
                    }
                  />
                </ThemedCard>
              )
            })
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end gap-2">
            <AdminBackButton
              fallbackHref={
                productContext
                  ? getModifierGroupHref({
                      groupId: group.id,
                      productId: productContext.id,
                      businessSlug,
                    })
                  : getModifierGroupHref({
                      groupId: group.id,
                      businessSlug,
                    })
              }
              label="Back to modifier subgroups"
            />
            {isProductScopedMode ? null : (
              <ThemedButton
                type="button"
                size="icon"
                aria-label="New Modifier Option"
                className="size-10 rounded-md p-0 shadow-sm sm:size-8"
                onClick={() => setCreateOpen(true)}
              >
                <Plus aria-hidden="true" />
                <span className="sr-only">New Modifier Option</span>
              </ThemedButton>
            )}
          </div>
        </div>
      </div>

      {createOpen ? (
        <ModifierOptionFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          modifierGroupId={group.id}
          modifierGroupName={group.name}
          optionGroups={group.optionGroups}
          businessSlug={businessSlug}
          initialOptionGroupId={subgroup.id}
          nextSortOrdersByOptionGroupId={nextSortOrdersByOptionGroupId}
          ungroupedNextSortOrder={ungroupedNextSortOrder}
        />
      ) : null}

      {activeOption && productContext && mode === "product" ? (
        <ModifierOptionOverridePanel
          open={Boolean(activeOption)}
          onOpenChange={(open) => {
            if (!open) setActiveOption(null)
          }}
          group={group}
          productContext={productContext}
          option={activeOption}
          businessSlug={businessSlug}
        />
      ) : activeOption ? (
        <ModifierOptionFormDialog
          open={Boolean(activeOption)}
          onOpenChange={(open) => {
            if (!open) setActiveOption(null)
          }}
          mode="edit"
          option={activeOption}
          businessSlug={businessSlug}
          modifierGroupId={group.id}
          modifierGroupName={group.name}
          optionGroups={group.optionGroups}
          initialOptionGroupId={subgroup.id}
          nextSortOrdersByOptionGroupId={nextSortOrdersByOptionGroupId}
          ungroupedNextSortOrder={ungroupedNextSortOrder}
        />
      ) : null}
    </main>
  )
}
