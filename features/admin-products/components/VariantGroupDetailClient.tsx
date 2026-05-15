"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, X } from "lucide-react"
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
import { saveProductVariantOptionOverride } from "@/features/admin-products/actions/save-product-variant-group-assignment"
import { saveVariantGroupOption } from "@/features/admin-products/actions/save-variant-group-option"
import { formatMoney } from "@/features/admin-products/components/ProductAdminFormParts"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type {
  VariantGroupDetail,
  VariantGroupOption,
  VariantGroupProductContext,
} from "@/features/admin-products/queries/get-variant-groups"

type VariantGroupDetailClientProps = {
  data: {
    businessName: string
    mode: "global" | "product" | "preview"
    group: VariantGroupDetail
    productContext: VariantGroupProductContext
  }
}

type OptionPanelState =
  | {
      mode: "create"
      option: null
    }
  | {
      mode: "edit"
      option: VariantGroupOption
    }

function getNextSortOrder(options: VariantGroupOption[]) {
  if (options.length === 0) return 1

  return Math.max(...options.map((option) => option.sort_order)) + 1
}

function getNullableSelectValue(value: boolean | null | undefined) {
  if (value === true) return "true"
  if (value === false) return "false"

  return "inherit"
}

function getEffectiveOption(option: VariantGroupOption) {
  return {
    price: option.override?.price_override ?? option.base_price,
    priceSource:
      option.override?.price_override === null ||
      option.override?.price_override === undefined
        ? "Inherited"
        : "Overridden",
    isEnabled: option.override?.is_enabled ?? option.is_enabled,
    isDefault: option.override?.is_default ?? option.is_default,
    sortOrder: option.override?.sort_order ?? option.sort_order,
  }
}

function getOptionDescription(
  option: VariantGroupOption,
  productContext: VariantGroupProductContext
) {
  const effectiveOption = getEffectiveOption(option)
  const defaultLabel = effectiveOption.isDefault ? "Default" : "Not default"
  const enabledLabel = effectiveOption.isEnabled ? "Enabled" : "Disabled"

  if (productContext) {
    return `${formatMoney(effectiveOption.price)} - ${
      effectiveOption.priceSource
    } - ${enabledLabel} - ${defaultLabel} - sort ${effectiveOption.sortOrder}`
  }

  return `${formatMoney(option.base_price)} - ${defaultLabel} - sort ${option.sort_order}`
}

function OptionFormPanel({
  open,
  onOpenChange,
  group,
  productContext,
  panelState,
  nextSortOrder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: VariantGroupDetail
  productContext: VariantGroupProductContext
  panelState: OptionPanelState | null
  nextSortOrder: number
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  if (!panelState) return null

  const option = panelState.option
  const isCreateMode = panelState.mode === "create"
  const isProductOverrideMode = productContext !== null
  const title = isProductOverrideMode
    ? "Edit Override"
    : isCreateMode
      ? "New Option"
      : "Edit Option"
  const description = isProductOverrideMode
    ? `Update product-specific settings for ${productContext?.name}.`
    : isCreateMode
    ? `Create an option for ${group.name}.`
    : "Update this variant group option."
  const submitLabel = isProductOverrideMode
    ? "Save Override"
    : isCreateMode
      ? "Create Option"
      : "Save Option"

  async function handleSubmit(formData: FormData) {
    if (isProductOverrideMode) {
      await saveProductVariantOptionOverride(formData)
    } else {
      await saveVariantGroupOption(formData)
    }
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
          <ThemedButton
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            className="absolute top-3 right-3 bg-transparent text-foreground hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden="true" />
            <span className="sr-only">Close</span>
          </ThemedButton>
          <ThemedSheetTitle className="text-3xl font-bold text-foreground">
            {title}
          </ThemedSheetTitle>
          <ThemedSheetDescription>{description}</ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          key={`${panelState.mode}-${option?.id ?? "new"}`}
          ref={formRef}
          action={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={`${PRODUCT_ADMIN_PANEL_BODY_CLASS} pb-4`}>
            <input type="hidden" name="groupId" value={group.id} />
            {option ? (
              <input type="hidden" name="optionId" value={option.id} />
            ) : null}

            <div className="grid gap-4">
              {isProductOverrideMode && option && productContext ? (
                <>
                  <input type="hidden" name="productId" value={productContext.id} />
                  <input
                    type="hidden"
                    name="variantGroupOptionId"
                    value={option.id}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{option.name}</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Group default: {formatMoney(option.base_price)}
                      {option.is_default ? ", default" : ", not default"},{" "}
                      {option.is_enabled ? "enabled" : "disabled"}, sort{" "}
                      {option.sort_order}
                    </p>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Price override</span>
                    <input
                      name="priceOverride"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={String(option.base_price)}
                      defaultValue={option.override?.price_override ?? ""}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Status</span>
                      <select
                        name="isEnabled"
                        defaultValue={getNullableSelectValue(
                          option.override?.is_enabled
                        )}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="inherit">Inherit</option>
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Default</span>
                      <select
                        name="isDefault"
                        defaultValue={getNullableSelectValue(
                          option.override?.is_default
                        )}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="inherit">Inherit</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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

                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Prep time</span>
                      <input
                        name="prepTimeMinutesOverride"
                        type="number"
                        min="0"
                        step="1"
                        placeholder={String(option.prep_time_minutes ?? "")}
                        defaultValue={
                          option.override?.prep_time_minutes_override ?? ""
                        }
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Name</span>
                <input
                  name="name"
                  required
                  defaultValue={option?.name ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Base price</span>
                  <input
                    name="basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={option?.base_price ?? 0}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Sort order</span>
                  <input
                    name="sortOrder"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={String(option?.sort_order ?? nextSortOrder)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Default</span>
                  <select
                    name="isDefault"
                    defaultValue={option?.is_default ? "true" : "false"}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    name="isEnabled"
                    defaultValue={option?.is_enabled === false ? "false" : "true"}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </label>
              </div>
                </>
              )}
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
              aria-label={submitLabel}
              className="size-10"
            >
              <Check aria-hidden="true" />
              <span className="sr-only">{submitLabel}</span>
            </ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}

export function VariantGroupDetailClient({
  data,
}: VariantGroupDetailClientProps) {
  const [optionPanelState, setOptionPanelState] =
    useState<OptionPanelState | null>(null)
  const { group, mode, productContext } = data
  const nextSortOrder = getNextSortOrder(group.options)
  const isProductMode = mode === "product"
  const isPreviewMode = mode === "preview"
  const isProductScopedMode = mode !== "global"
  const description = isProductMode
    ? `Product-specific options for ${data.businessName}.`
    : isPreviewMode
      ? `Preview reusable variant options for ${data.businessName}.`
    : `Reusable variant group for ${data.businessName}.`

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title="Variant Group Options"
            description={description}
          />

          <div>
            <p className="text-sm font-semibold">
              {isProductScopedMode ? "Variant Group For" : "Variant Group"}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {productContext
                ? `${productContext.name} -> ${group.name}`
                : group.name}
            </p>
            {isProductMode ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Changes here are product overrides. Group defaults stay
                unchanged.
              </p>
            ) : null}
            {isPreviewMode ? (
              <p className="mt-1 text-xs text-muted-foreground">
                This group is not assigned to this product. Options are
                read-only here.
              </p>
            ) : null}
          </div>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          <div className="pt-2">
            <h2 className="mb-2 text-sm font-semibold">Options</h2>
            <div className="space-y-2">
              {group.options.length === 0 ? (
                <ThemedCard className="p-5 text-center">
                  <p className="font-semibold">No options yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add reusable options before attaching this group to products.
                  </p>
                </ThemedCard>
              ) : (
                group.options.map((option) => {
                  const optionCard = (
                    <ThemedCard
                      className={
                        option.is_enabled
                          ? "overflow-hidden py-0"
                          : "overflow-hidden bg-muted/30 py-0"
                      }
                    >
                      <CompactRecordRow
                        title={option.name}
                        statusIcon={
                          <CompactRecordStatusIcon
                            enabled={getEffectiveOption(option).isEnabled}
                          />
                        }
                        description={getOptionDescription(
                          option,
                          isProductMode ? productContext : null
                        )}
                      />
                    </ThemedCard>
                  )

                  if (isPreviewMode) {
                    return <div key={option.id}>{optionCard}</div>
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={`Edit variant option ${option.name}`}
                      onClick={() =>
                        setOptionPanelState({ mode: "edit", option })
                      }
                      className={
                        option.is_enabled
                          ? "block w-full text-left"
                          : "block w-full text-left opacity-75"
                      }
                    >
                      {optionCard}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end">
            {isProductScopedMode ? null : (
              <ThemedButton
                type="button"
                size="icon"
                aria-label="New Variant Group Option"
                className="size-10 rounded-md p-0 shadow-sm sm:size-8"
                onClick={() =>
                  setOptionPanelState({ mode: "create", option: null })
                }
              >
                <Plus aria-hidden="true" />
                <span className="sr-only">New Variant Group Option</span>
              </ThemedButton>
            )}
          </div>
        </div>
      </div>

      <OptionFormPanel
        open={optionPanelState !== null}
        onOpenChange={(open) => {
          if (!open) setOptionPanelState(null)
        }}
        group={group}
        productContext={isProductMode ? productContext : null}
        panelState={optionPanelState}
        nextSortOrder={nextSortOrder}
      />
    </main>
  )
}
