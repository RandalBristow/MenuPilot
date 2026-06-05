"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { createModifierOption } from "@/features/admin-modifiers/actions/create-modifier-option"
import type { CreateModifierOptionResult } from "@/features/admin-modifiers/actions/create-modifier-option"
import { setModifierOptionEnabled } from "@/features/admin-modifiers/actions/set-modifier-option-enabled"
import { updateModifierOption } from "@/features/admin-modifiers/actions/update-modifier-option"
import type { UpdateModifierOptionResult } from "@/features/admin-modifiers/actions/update-modifier-option"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import {
  MODIFIER_FORM_BODY_CLASS,
  MODIFIER_FORM_CLASS,
  MODIFIER_FORM_FOOTER_CLASS,
  MODIFIER_FORM_SHEET_CONTENT_CLASS,
} from "@/features/admin-modifiers/components/modifier-form-panel-styles"
import type {
  RawModifierOption,
  RawModifierOptionGroup,
} from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

type ModifierOptionFormMode = "create" | "edit"

type ModifierOptionFormDialogProps = {
  businessSlug?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  modifierGroupId: string
  modifierGroupName: string
  optionGroups: RawModifierOptionGroup[]
  initialOptionGroupId?: string | null
  nextSortOrdersByOptionGroupId?: Record<string, number>
  ungroupedNextSortOrder?: number
  option?: RawModifierOption
  mode?: ModifierOptionFormMode
}

export function ModifierOptionFormDialog({
  businessSlug,
  open,
  onOpenChange,
  modifierGroupId,
  modifierGroupName,
  optionGroups,
  initialOptionGroupId = null,
  nextSortOrdersByOptionGroupId = {},
  ungroupedNextSortOrder = 1,
  option,
  mode = "create",
}: ModifierOptionFormDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const sortOrderRef = useRef<HTMLInputElement>(null)
  const isCreateMode = mode === "create"
  const fallbackOptionGroupId = optionGroups[0]?.id ?? ""
  const initialOptionGroupValue =
    initialOptionGroupId ?? option?.modifier_option_group_id ?? fallbackOptionGroupId
  const [selectedOptionGroupValue, setSelectedOptionGroupValue] = useState(
    initialOptionGroupValue
  )
  const selectedOptionGroupId = selectedOptionGroupValue
  const selectedOptionGroup = selectedOptionGroupId
    ? optionGroups.find((optionGroup) => optionGroup.id === selectedOptionGroupId)
    : undefined
  const hasFixedOptionGroup = isCreateMode && Boolean(initialOptionGroupId)
  const title = isCreateMode
    ? "Create modifier option"
    : (selectedOptionGroup?.name ?? modifierGroupName)
  const description = isCreateMode
    ? `Add an option to ${modifierGroupName}.`
    : "Update this modifier option."
  const submitLabel = isCreateMode ? "Create option" : "Save option"
  const [formResult, setFormResult] = useState<
    CreateModifierOptionResult | UpdateModifierOptionResult | null
  >(null)
  const nextSortOrder =
    selectedOptionGroupValue
      ? nextSortOrdersByOptionGroupId[selectedOptionGroupValue] ?? 1
      : ungroupedNextSortOrder

  function handleUseNextSortOrder() {
    if (sortOrderRef.current) {
      sortOrderRef.current.value = String(nextSortOrder)
    }
  }

  async function handleSubmit(formData: FormData) {
    setFormResult(null)

    if (isCreateMode) {
      const result = await createModifierOption(formData)

      if (result.status !== "created") {
        setFormResult(result)
        return
      }
    } else {
      const result = await updateModifierOption(formData)

      if (result.status !== "updated") {
        setFormResult(result)
        return
      }
    }

    formRef.current?.reset()
    onOpenChange(false)
    router.refresh()
  }

  async function handleEnabledChange() {
    if (!option) return

    const formData = new FormData()
    if (businessSlug) formData.set("businessSlug", businessSlug)
    formData.set("optionId", option.id)
    formData.set("modifierGroupId", modifierGroupId)
    formData.set("isEnabled", String(!option.is_enabled))

    await setModifierOptionEnabled(formData)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <ThemedSheet open={open} onOpenChange={onOpenChange}>
      <ThemedSheetContent
        side="bottom"
        showCloseButton={false}
        className={MODIFIER_FORM_SHEET_CONTENT_CLASS}
      >
        <ThemedSheetHeader className="shrink-0 border-b p-4">
          <ThemedSheetTitle>{title}</ThemedSheetTitle>
          <ThemedSheetDescription>{description}</ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          key={`${mode}-${option?.id ?? "new"}`}
          ref={formRef}
          action={handleSubmit}
          className={MODIFIER_FORM_CLASS}
        >
          <div className={MODIFIER_FORM_BODY_CLASS}>
            {businessSlug ? (
              <input type="hidden" name="businessSlug" value={businessSlug} />
            ) : null}

            <input
              type="hidden"
              name="modifierGroupId"
              value={modifierGroupId}
            />
            {option ? (
              <input type="hidden" name="optionId" value={option.id} />
            ) : null}

            {!isCreateMode && option ? (
              <input
                type="hidden"
                name="isEnabled"
                value={String(option.is_enabled)}
              />
            ) : null}

            {formResult ? (
              <p
                className={
                  formResult.status === "updated" ||
                  formResult.status === "created"
                    ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                    : "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                }
              >
                {formResult.message}
              </p>
            ) : null}

            {optionGroups.length === 0 ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Create a Modifier Option Group/List before adding options.
              </p>
            ) : null}

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <label className="block min-w-0 space-y-1.5 text-sm">
                <span className="font-medium">Option name</span>
                <input
                  name="name"
                  defaultValue={option?.name ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  placeholder="Example: Extra Cheese"
                  required
                />
              </label>

              {!isCreateMode && option ? (
                <ThemedButton
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`${option.is_enabled ? "Disable" : "Enable"} modifier option ${option.name}`}
                  className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
                  onClick={() => void handleEnabledChange()}
                >
                  {option.is_enabled ? (
                    <ThumbsUp aria-hidden="true" />
                  ) : (
                    <ThumbsDown aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {option.is_enabled ? "Disable" : "Enable"} modifier option
                  </span>
                </ThemedButton>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Price</span>
                <input
                  name="priceDelta"
                  type="number"
                  step="0.01"
                  defaultValue={option ? String(option.price_delta) : "0.00"}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  required
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Sort order</span>
                <input
                  ref={sortOrderRef}
                  name="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={
                    option ? String(option.sort_order) : String(nextSortOrder)
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  placeholder="Next available"
                />
                <ThemedButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 h-8 bg-background px-2 text-xs text-foreground hover:bg-muted"
                  onClick={handleUseNextSortOrder}
                >
                  Next Available: {nextSortOrder}
                </ThemedButton>
              </label>
            </div>

            {hasFixedOptionGroup ? (
              <input
                type="hidden"
                name="modifierOptionGroupId"
                value={selectedOptionGroupValue}
              />
            ) : (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Option group</span>
                <select
                  name="modifierOptionGroupId"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={selectedOptionGroupValue}
                  required
                  onChange={(event) =>
                    setSelectedOptionGroupValue(event.target.value)
                  }
                >
                  {optionGroups.map((optionGroup) => (
                    <option key={optionGroup.id} value={optionGroup.id}>
                      {optionGroup.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className={MODIFIER_FORM_FOOTER_CLASS}>
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
              disabled={optionGroups.length === 0}
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
