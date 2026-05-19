"use client"

import { useRef, useState } from "react"
import Link from "next/link"
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
import { saveProductModifierOptionOverride } from "@/features/admin-modifiers/actions/save-product-modifier-option-override"
import { ModifierOptionFormDialog } from "@/features/admin-modifiers/components/ModifierOptionFormDialog"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type {
  ModifierGroupDetail,
  ModifierGroupDetailOption,
  ModifierGroupProductContext,
} from "@/features/admin-modifiers/queries/get-modifier-group-detail"

type ModifierGroupDetailClientProps = {
  data: {
    businessName: string
    mode: "global" | "product" | "preview"
    group: ModifierGroupDetail
    productContext: ModifierGroupProductContext
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: value === 0 ? "never" : "always",
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
    sortOrder: option.override?.sort_order ?? option.sort_order,
  }
}

function getOptionDescription({
  option,
  productContext,
}: {
  option: ModifierGroupDetailOption
  productContext: ModifierGroupProductContext
}) {
  const effective = getEffectiveOption(option)
  const enabledLabel = effective.isEnabled ? "Enabled" : "Disabled"

  if (productContext) {
    return `${formatMoney(effective.priceDelta)} - ${
      effective.priceSource
    } - ${enabledLabel} - sort ${effective.sortOrder}`
  }

  return `${formatMoney(option.price_delta)} - ${enabledLabel} - sort ${option.sort_order}`
}

function OverridePanel({
  open,
  onOpenChange,
  group,
  productContext,
  option,
}: {
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
          <ThemedButton
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            className="absolute right-3 top-3 bg-transparent text-foreground hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden="true" />
            <span className="sr-only">Close</span>
          </ThemedButton>
          <ThemedSheetTitle className="text-3xl font-bold text-foreground">
            Edit Override
          </ThemedSheetTitle>
          <ThemedSheetDescription>
            Update product-specific settings for {productContext.name}.
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
            <input type="hidden" name="modifierGroupId" value={group.id} />
            <input type="hidden" name="modifierOptionId" value={option.id} />

            <div className="grid gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{option.name}</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Group default: {formatMoney(option.price_delta)},{" "}
                  {option.is_enabled ? "enabled" : "disabled"}, sort{" "}
                  {option.sort_order}
                </p>
              </div>

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

export function ModifierGroupDetailClient({
  data,
}: ModifierGroupDetailClientProps) {
  const [activeOption, setActiveOption] =
    useState<ModifierGroupDetailOption | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const { group, mode, productContext } = data
  const isProductMode = mode === "product"
  const isPreviewMode = mode === "preview"
  const isProductScopedMode = mode !== "global"
  const description = isProductMode
    ? `Product-specific choices for ${data.businessName}.`
    : isPreviewMode
      ? `Preview reusable modifier choices for ${data.businessName}.`
      : `Reusable modifier group for ${data.businessName}.`

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader title="Modifier Group Options" description={description} />

          <div>
            <p className="text-sm font-semibold">
              {isProductScopedMode ? "Modifier Group For" : "Modifier Group"}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {productContext
                ? `${productContext.name} -> ${group.name}`
                : group.name}
            </p>
            {isProductMode ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Changes here are product overrides. Group defaults stay unchanged.
              </p>
            ) : null}
            {isPreviewMode ? (
              <p className="mt-1 text-xs text-muted-foreground">
                This group is not assigned to this product. Options are read-only here.
              </p>
            ) : null}
          </div>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pb-3">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Rules</h2>
            <ThemedCard className="p-3">
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p>{group.is_required ? "Required" : "Optional"}</p>
                <p className="capitalize">{group.selection_type}</p>
                <p>Min {group.min_required}</p>
                <p>Max {group.max_allowed ?? "No max"}</p>
                <p>Placement {group.supports_placement ? "on" : "off"}</p>
                <p>Multiplier {group.supports_multiplier ? "on" : "off"}</p>
              </div>
            </ThemedCard>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Options</h2>
            {group.options.length === 0 ? (
              <ThemedCard className="p-5 text-center">
                <p className="font-semibold">No options yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add reusable options before attaching this group to products.
                </p>
              </ThemedCard>
            ) : (
              <div className="space-y-2">
                {group.options.map((option) => {
                  const optionCard = (
                    <ThemedCard
                      className={
                        getEffectiveOption(option).isEnabled
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
                        description={getOptionDescription({
                          option,
                          productContext: isProductMode
                            ? productContext
                            : null,
                        })}
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
                      aria-label={`Edit modifier option ${option.name}`}
                      onClick={() => setActiveOption(option)}
                      className="block w-full text-left"
                    >
                      {optionCard}
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-between gap-2">
            <ThemedButton
              asChild
              variant="outline"
              size="icon"
              aria-label="Close"
              className="size-10 bg-background text-foreground hover:bg-muted"
            >
              <Link
                href={
                  productContext
                    ? `/admin/products/modifier-groups?productId=${productContext.id}`
                    : "/admin/modifiers/groups"
                }
              >
                <X aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Link>
            </ThemedButton>

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

      {isProductMode && productContext ? (
        <OverridePanel
          open={activeOption !== null}
          onOpenChange={(open) => {
            if (!open) setActiveOption(null)
          }}
          group={group}
          productContext={productContext}
          option={activeOption}
        />
      ) : activeOption ? (
        <ModifierOptionFormDialog
          open={Boolean(activeOption)}
          onOpenChange={(open) => {
            if (!open) setActiveOption(null)
          }}
          mode="edit"
          option={activeOption}
          modifierGroupId={group.id}
          modifierGroupName={group.name}
          optionGroups={group.optionGroups}
        />
      ) : null}

      <ModifierOptionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        modifierGroupId={group.id}
        modifierGroupName={group.name}
        optionGroups={group.optionGroups}
      />
    </main>
  )
}
