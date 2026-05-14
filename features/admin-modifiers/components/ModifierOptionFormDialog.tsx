"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"
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
import { ModifierStatusToggleControl } from "@/features/admin-modifiers/components/ModifierStatusToggleControl"
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
  const title = isCreateMode ? "Create modifier option" : "Edit modifier option"
  const description = isCreateMode
    ? `Add an option to ${modifierGroupName}.`
    : `Update an option in ${modifierGroupName}.`
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
        <ThemedSheetHeader className="shrink-0">
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
            <input
              type="hidden"
              name="modifierGroupId"
              value={modifierGroupId}
            />
            {option ? (
              <input type="hidden" name="optionId" value={option.id} />
            ) : null}

            {!isCreateMode && option ? (
              <ModifierStatusToggleControl
                enabled={option.is_enabled}
                name={option.name}
                entityLabel="modifier option"
                onToggle={() => void handleEnabledChange()}
              />
            ) : null}

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Option name</span>
              <input
                name="name"
                defaultValue={option?.name ?? ""}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                placeholder="Example: Extra Cheese"
                required
              />
            </label>

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
              <span className="font-medium">Subgroup</span>
              <select
                name="modifierOptionGroupId"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={
                  option?.modifier_option_group_id ??
                  initialOptionGroupId ??
                  "none"
                }
              >
                <option value="none">None</option>
                {optionGroups.map((optionGroup) => (
                  <option key={optionGroup.id} value={optionGroup.id}>
                    {optionGroup.name}
                  </option>
                ))}
              </select>
            </label>
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
