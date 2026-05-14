"use client"

import type { ReactNode } from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"
import { createModifierGroup } from "@/features/admin-modifiers/actions/create-modifier-group"
import { setModifierGroupEnabled } from "@/features/admin-modifiers/actions/set-modifier-group-enabled"
import { updateModifierGroup } from "@/features/admin-modifiers/actions/update-modifier-group"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
  ThemedSheetTrigger,
} from "@/components/themed/ThemedSheet"
import {
  MODIFIER_FORM_BODY_CLASS,
  MODIFIER_FORM_CLASS,
  MODIFIER_FORM_FOOTER_CLASS,
  MODIFIER_FORM_SHEET_CONTENT_CLASS,
} from "@/features/admin-modifiers/components/modifier-form-panel-styles"
import { ModifierStatusToggleControl } from "@/features/admin-modifiers/components/ModifierStatusToggleControl"
import type { ModifierGroupCategory } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"
import type { RawModifierGroup } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

type ModifierGroupFormMode = "create" | "edit"

type ModifierGroupFormDialogProps = {
  categories: ModifierGroupCategory[]
  selectedCategoryId: string
  mode?: ModifierGroupFormMode
  group?: RawModifierGroup
  triggerLabel?: string
  triggerIcon?: ReactNode
  triggerAriaLabel?: string
  onCreated?: (categoryId: string) => void
}

export function ModifierGroupFormDialog({
  categories,
  selectedCategoryId,
  mode = "create",
  group,
  triggerLabel,
  triggerIcon,
  triggerAriaLabel,
  onCreated,
}: ModifierGroupFormDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [categoryId, setCategoryId] = useState(selectedCategoryId)
  const isCreateMode = mode === "create"
  const title = isCreateMode ? "Create modifier group" : "Edit modifier group"
  const description = isCreateMode
    ? "Add a modifier group to a category. Options can be added later."
    : "Update this modifier group rule set."
  const submitLabel = isCreateMode ? "Create group" : "Save group"

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCategoryId(selectedCategoryId)
    }

    setOpen(nextOpen)
  }

  async function handleSubmit(formData: FormData) {
    if (isCreateMode) {
      await createModifierGroup(formData)
      const submittedCategoryId = String(formData.get("categoryId") ?? "")

      formRef.current?.reset()
      setOpen(false)
      onCreated?.(submittedCategoryId)
      router.refresh()
    } else {
      await updateModifierGroup(formData)
      const submittedCategoryId = String(formData.get("categoryId") ?? "")

      setOpen(false)
      onCreated?.(submittedCategoryId)
      router.refresh()
    }
  }

  async function handleEnabledChange() {
    if (!group) return

    const formData = new FormData()
    formData.set("modifierGroupId", group.id)
    formData.set("isEnabled", String(!group.is_enabled))

    await setModifierGroupEnabled(formData)
    setOpen(false)
    router.refresh()
  }

  return (
    <ThemedSheet open={open} onOpenChange={handleOpenChange}>
      <ThemedSheetTrigger asChild>
        <ThemedButton
          type="button"
          variant={isCreateMode ? "default" : "outline"}
          size={triggerIcon ? "icon" : "default"}
          aria-label={triggerAriaLabel}
          className={
            triggerIcon
              ? isCreateMode
                ? "size-10 rounded-md p-0 shadow-sm sm:size-8"
                : "size-10 rounded-md border-border bg-background p-0 text-foreground shadow-sm hover:bg-muted sm:size-8"
              : isCreateMode
                ? "w-full sm:w-auto"
                : "bg-background text-foreground hover:bg-muted"
          }
        >
          {triggerIcon ??
            (triggerLabel ?? (isCreateMode ? "Add Group" : "Edit Group"))}
        </ThemedButton>
      </ThemedSheetTrigger>

      <ThemedSheetContent
        side="bottom"
        className={MODIFIER_FORM_SHEET_CONTENT_CLASS}
      >
        <ThemedSheetHeader className="shrink-0">
          <ThemedSheetTitle>{title}</ThemedSheetTitle>
          <ThemedSheetDescription>{description}</ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          key={`${mode}-${group?.id ?? "new"}`}
          ref={formRef}
          action={handleSubmit}
          className={MODIFIER_FORM_CLASS}
        >
          <div className={MODIFIER_FORM_BODY_CLASS}>
            {group ? (
              <input type="hidden" name="modifierGroupId" value={group.id} />
            ) : null}

            {!isCreateMode && group ? (
              <ModifierStatusToggleControl
                enabled={group.is_enabled}
                name={group.name}
                entityLabel="modifier group"
                onToggle={() => void handleEnabledChange()}
              />
            ) : null}

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Category</span>
              <select
                name="categoryId"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Group name</span>
              <input
                name="name"
                defaultValue={group?.name ?? ""}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                placeholder="Example: Pizza Cheese"
                required
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Selection</span>
                <select
                  name="selectionType"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  defaultValue={group?.selection_type ?? "single"}
                  required
                >
                  <option value="single">Single</option>
                  <option value="multiple">Multiple</option>
                </select>
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Required</span>
                <select
                  name="isRequired"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  defaultValue={group?.is_required ? "true" : "false"}
                  required
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Min</span>
                  <input
                    name="minRequired"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={String(group?.min_required ?? 0)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    required
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Max</span>
                  <input
                    name="maxAllowed"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={group?.max_allowed ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    placeholder="No max"
                  />
                </label>
              </div>

              {!isCreateMode && group ? (
                <input
                  type="hidden"
                  name="isEnabled"
                  value={String(group.is_enabled)}
                />
              ) : null}
            </div>
          </div>

          <div className={MODIFIER_FORM_FOOTER_CLASS}>
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
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
