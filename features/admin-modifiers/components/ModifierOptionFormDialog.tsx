"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { createModifierOption } from "@/features/admin-modifiers/actions/create-modifier-option"
import { updateModifierOption } from "@/features/admin-modifiers/actions/update-modifier-option"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
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

  return (
    <ThemedSheet open={open} onOpenChange={onOpenChange}>
      <ThemedSheetContent side="right" className="w-full sm:max-w-xl">
        <ThemedSheetHeader>
          <ThemedSheetTitle>{title}</ThemedSheetTitle>
          <ThemedSheetDescription>{description}</ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          key={`${mode}-${option?.id ?? "new"}`}
          ref={formRef}
          action={handleSubmit}
          className="mt-6 space-y-4"
        >
          <input
            type="hidden"
            name="modifierGroupId"
            value={modifierGroupId}
          />
          {option ? (
            <input type="hidden" name="optionId" value={option.id} />
          ) : null}

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Option name</span>
            <input
              name="name"
              defaultValue={option?.name ?? ""}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="Example: Extra Cheese"
              required
            />
          </label>

          <label className="space-y-1.5 text-sm">
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

          <label className="space-y-1.5 text-sm">
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

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <ThemedButton
              type="button"
              variant="outline"
              className="bg-background text-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </ThemedButton>
            <ThemedButton type="submit">{submitLabel}</ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}
