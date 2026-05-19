"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { createModifierOption } from "@/features/admin-modifiers/actions/create-modifier-option"
import { setModifierOptionEnabled } from "@/features/admin-modifiers/actions/set-modifier-option-enabled"
import { updateModifierOption } from "@/features/admin-modifiers/actions/update-modifier-option"
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
  open: boolean
  onOpenChange: (open: boolean) => void
  modifierGroupId: string
  modifierGroupName: string
  optionGroups: RawModifierOptionGroup[]
  initialOptionGroupId?: string | null
  option?: RawModifierOption
  mode?: ModifierOptionFormMode
}

export function ModifierOptionFormDialog({
  open,
  onOpenChange,
  modifierGroupId,
  modifierGroupName,
  optionGroups,
  initialOptionGroupId = null,
  option,
  mode = "create",
}: ModifierOptionFormDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const isCreateMode = mode === "create"
  const selectedOptionGroupId =
    initialOptionGroupId ?? option?.modifier_option_group_id ?? null
  const selectedOptionGroup = selectedOptionGroupId
    ? optionGroups.find((optionGroup) => optionGroup.id === selectedOptionGroupId)
    : undefined
  const hasFixedOptionGroup = Boolean(initialOptionGroupId)
  const title = isCreateMode
    ? "Create modifier option"
    : (selectedOptionGroup?.name ?? modifierGroupName)
  const description = isCreateMode
    ? `Add an option to ${modifierGroupName}.`
    : "Update this modifier option."
  const submitLabel = isCreateMode ? "Create option" : "Save option"

  async function handleSubmit(formData: FormData) {
    if (isCreateMode) {
      await createModifierOption(formData)
    } else {
      await updateModifierOption(formData)
    }

    formRef.current?.reset()
    onOpenChange(false)
    router.refresh()
  }

  async function handleEnabledChange() {
    if (!option) return

    const formData = new FormData()
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
        className={MODIFIER_FORM_SHEET_CONTENT_CLASS}
      >
        <ThemedSheetHeader className="shrink-0 border-b pb-3">
          <ThemedSheetTitle className="text-2xl leading-tight">
            {title}
          </ThemedSheetTitle>
          <ThemedSheetDescription>{description}</ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          key={`${mode}-${option?.id ?? "new"}`}
          ref={formRef}
          action={handleSubmit}
          className={MODIFIER_FORM_CLASS}
        >
          <div className={MODIFIER_FORM_BODY_CLASS}>
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
                  name="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={option ? String(option.sort_order) : ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  placeholder={isCreateMode ? "Next" : "0"}
                  required={!isCreateMode}
                />
              </label>
            </div>

            {hasFixedOptionGroup ? (
              <input
                type="hidden"
                name="modifierOptionGroupId"
                value={selectedOptionGroupId ?? "none"}
              />
            ) : (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Option group</span>
                <select
                  name="modifierOptionGroupId"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  defaultValue={selectedOptionGroupId ?? "none"}
                >
                  <option value="none">None</option>
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
