"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { createModifierOptionGroup } from "@/features/admin-modifiers/actions/create-modifier-option-group"
import { setModifierOptionGroupEnabled } from "@/features/admin-modifiers/actions/set-modifier-option-group-enabled"
import { updateModifierOptionGroup } from "@/features/admin-modifiers/actions/update-modifier-option-group"
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
import type { RawModifierOptionGroup } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

type ModifierOptionGroupFormMode = "create" | "edit"

type ModifierOptionGroupFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: ModifierOptionGroupFormMode
  modifierGroupId: string
  modifierGroupName: string
  optionGroup?: RawModifierOptionGroup
}

export function ModifierOptionGroupFormDialog({
  open,
  onOpenChange,
  mode = "create",
  modifierGroupId,
  modifierGroupName,
  optionGroup,
}: ModifierOptionGroupFormDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const isCreateMode = mode === "create"
  const title = isCreateMode
    ? "Create option group"
    : modifierGroupName
  const description = isCreateMode
    ? `Add an option group to ${modifierGroupName}.`
    : "Update this option group."
  const submitLabel = isCreateMode ? "Create option group" : "Save option group"

  async function handleSubmit(formData: FormData) {
    if (isCreateMode) {
      await createModifierOptionGroup(formData)
    } else {
      await updateModifierOptionGroup(formData)
    }

    formRef.current?.reset()
    onOpenChange(false)
    router.refresh()
  }

  async function handleEnabledChange() {
    if (!optionGroup) return

    const formData = new FormData()
    formData.set("modifierGroupId", modifierGroupId)
    formData.set("modifierOptionGroupId", optionGroup.id)
    formData.set("isEnabled", String(!optionGroup.is_enabled))

    await setModifierOptionGroupEnabled(formData)
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
          key={`${mode}-${optionGroup?.id ?? "new"}`}
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
            {optionGroup ? (
              <input
                type="hidden"
                name="modifierOptionGroupId"
                value={optionGroup.id}
              />
            ) : null}

            {!isCreateMode && optionGroup ? (
              <input
                type="hidden"
                name="isEnabled"
                value={String(optionGroup.is_enabled)}
              />
            ) : null}

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <label className="block min-w-0 space-y-1.5 text-sm">
                <span className="font-medium">Option group name</span>
                <input
                  name="name"
                  defaultValue={optionGroup?.name ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  placeholder="Example: Sauce"
                  required
                />
              </label>

              {!isCreateMode && optionGroup ? (
                <ThemedButton
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`${optionGroup.is_enabled ? "Disable" : "Enable"} option group ${optionGroup.name}`}
                  className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
                  onClick={() => void handleEnabledChange()}
                >
                  {optionGroup.is_enabled ? (
                    <ThumbsUp aria-hidden="true" />
                  ) : (
                    <ThumbsDown aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {optionGroup.is_enabled ? "Disable" : "Enable"} option group
                  </span>
                </ThemedButton>
              ) : null}
            </div>

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Description</span>
              <textarea
                name="description"
                defaultValue={optionGroup?.description ?? ""}
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Optional note for admins or future display."
              />
            </label>

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Sort order</span>
              <input
                name="sortOrder"
                type="number"
                min="0"
                step="1"
                defaultValue={optionGroup ? String(optionGroup.sort_order) : ""}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                placeholder={isCreateMode ? "Append to end" : "0"}
                required={!isCreateMode}
              />
            </label>

            {isCreateMode ? (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Status</span>
                <select
                  name="isEnabled"
                  defaultValue="true"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </label>
            ) : null}
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
