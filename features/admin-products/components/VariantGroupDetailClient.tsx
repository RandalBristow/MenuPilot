"use client"

import { useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react"
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
import { saveProductVariantOptionOverride } from "@/features/admin-products/actions/save-product-variant-group-assignment"
import { saveVariantGroupOption } from "@/features/admin-products/actions/save-variant-group-option"
import { formatMoney } from "@/features/admin-products/components/ProductAdminFormParts"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import {
  getProductAdminHref,
  getProductVariantAssignmentsHref,
} from "@/features/admin-products/utils/product-admin-routes"
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
  businessSlug?: string
  writesEnabled?: boolean
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

function OverrideSegmentedControl({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string
  name: string
  defaultValue: string
  options: Array<{
    value: string
    label: ReactNode
    ariaLabel?: string
  }>
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-3 overflow-hidden rounded-md border bg-background p-1">
        {options.map((option) => (
          <label key={option.value} className="min-w-0">
            <input
              type="radio"
              name={name}
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

  if (productContext) {
    return `${formatMoney(effectiveOption.price)} - ${effectiveOption.priceSource} - ${defaultLabel}`
  }

  return `${formatMoney(option.base_price)} - ${defaultLabel}`
}

function getBackHref({
  productContext,
  businessSlug,
}: {
  productContext: VariantGroupProductContext
  businessSlug?: string
}) {
  if (productContext) {
    return getProductVariantAssignmentsHref(productContext.id, businessSlug)
  }

  return getProductAdminHref("variant-groups", businessSlug)
}

function OptionFormPanel({
  open,
  onOpenChange,
  group,
  productContext,
  panelState,
  nextSortOrder,
  businessSlug,
  writesEnabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: VariantGroupDetail
  productContext: VariantGroupProductContext
  panelState: OptionPanelState | null
  nextSortOrder: number
  businessSlug?: string
  writesEnabled: boolean
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnabled, setIsEnabled] = useState(
    panelState?.option?.is_enabled ?? true
  )

  if (!panelState) return null

  const option = panelState.option
  const isCreateMode = panelState.mode === "create"
  const isProductOverrideMode = productContext !== null
  const title = isProductOverrideMode
    ? (option?.name ?? "Edit Override")
    : isCreateMode
      ? "New Option"
      : group.name
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
    if (isSubmittingRef.current) return

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      if (isProductOverrideMode) {
        await saveProductVariantOptionOverride(formData)
      } else {
        await saveVariantGroupOption(formData)
      }
      formRef.current?.reset()
      onOpenChange(false)
      router.refresh()
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <ThemedSheet open={open} onOpenChange={onOpenChange}>
      <ThemedSheetContent
        side="bottom"
        showCloseButton={false}
        className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
      >
        <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
          <ThemedSheetTitle>{title}</ThemedSheetTitle>
          <ThemedSheetDescription>{description}</ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          key={`${panelState.mode}-${option?.id ?? "new"}`}
          ref={formRef}
          action={writesEnabled ? handleSubmit : undefined}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={`${PRODUCT_ADMIN_PANEL_BODY_CLASS} pb-4`}>
            {businessSlug ? (
              <input type="hidden" name="businessSlug" value={businessSlug} />
            ) : null}
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
                    <OverrideSegmentedControl
                      label="Status"
                      name="isEnabled"
                      defaultValue={getNullableSelectValue(
                        option.override?.is_enabled
                      )}
                      options={[
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
                              <ThumbsDown
                                aria-hidden="true"
                                className="size-4"
                              />
                              <span className="sr-only">Disabled</span>
                            </>
                          ),
                          ariaLabel: "Disabled",
                        },
                      ]}
                    />

                    <OverrideSegmentedControl
                      label="Default"
                      name="isDefault"
                      defaultValue={getNullableSelectValue(
                        option.override?.is_default
                      )}
                      options={[
                        { value: "inherit", label: "Inherit" },
                        { value: "true", label: "Yes" },
                        { value: "false", label: "No" },
                      ]}
                    />
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
              {!isCreateMode ? (
                <input
                  type="hidden"
                  name="isEnabled"
                  value={String(isEnabled)}
                />
              ) : null}

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium">Option name</span>
                  <input
                    name="name"
                    required
                    defaultValue={option?.name ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                {!isCreateMode && option ? (
                  <ThemedButton
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`${isEnabled ? "Disable" : "Enable"} variant option ${option.name}`}
                    className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
                    onClick={() => setIsEnabled((current) => !current)}
                  >
                    {isEnabled ? (
                      <ThumbsUp aria-hidden="true" />
                    ) : (
                      <ThumbsDown aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {isEnabled ? "Disable" : "Enable"} variant option
                    </span>
                  </ThemedButton>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
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
              </div>

              {isCreateMode ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Status</span>
                    <select
                      name="isEnabled"
                      defaultValue="true"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </label>
                </div>
              ) : null}
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
              disabled={!writesEnabled || isSubmitting}
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
  businessSlug,
  writesEnabled = true,
}: VariantGroupDetailClientProps) {
  const { group, mode, productContext } = data
  const [optionPanelState, setOptionPanelState] =
    useState<OptionPanelState | null>(null)
  const nextSortOrder = getNextSortOrder(group.options)
  const isProductMode = mode === "product"
  const isPreviewMode = mode === "preview"
  const isProductScopedMode = mode !== "global"
  const backHref = getBackHref({ productContext, businessSlug })
  const description = isProductMode
    ? `Product-specific options for ${productContext?.name ?? data.businessName}.`
    : isPreviewMode
      ? `Preview reusable variant options for ${productContext?.name ?? data.businessName}.`
    : `Options inside ${group.name}.`

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title={`${group.name} Options`}
            description={description}
          />
          {isProductMode ? (
            <p className="text-xs text-muted-foreground">
              Product overrides. Group defaults stay unchanged.
            </p>
          ) : null}
          {isPreviewMode ? (
            <p className="text-xs text-muted-foreground">
              This group is not assigned to this product. Options are read-only
              here.
            </p>
          ) : null}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          <div>
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
          <div className="flex justify-end gap-2">
            <AdminBackButton fallbackHref={backHref} label="Back" />
            {isProductScopedMode ? null : (
              <ThemedButton
                type="button"
                size="icon"
                aria-label="New Variant Group Option"
                className="size-10 rounded-md p-0 shadow-sm"
                disabled={!writesEnabled}
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
        key={`${optionPanelState?.mode ?? "closed"}-${optionPanelState?.option?.id ?? "new"}`}
        open={optionPanelState !== null}
        onOpenChange={(open) => {
          if (!open) setOptionPanelState(null)
        }}
        group={group}
        productContext={isProductMode ? productContext : null}
        panelState={optionPanelState}
        nextSortOrder={nextSortOrder}
        businessSlug={businessSlug}
        writesEnabled={writesEnabled}
      />
    </main>
  )
}
