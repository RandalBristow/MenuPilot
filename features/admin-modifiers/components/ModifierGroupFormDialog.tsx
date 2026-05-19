"use client"

import type { ReactNode } from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ThumbsDown, ThumbsUp, X } from "lucide-react"
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
import type { ModifierGroupCategory } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"
import type { RawModifierGroup } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

type ModifierGroupFormMode = "create" | "edit"

type ModifierGroupFormDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
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
  open,
  onOpenChange,
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
  const [internalOpen, setInternalOpen] = useState(false)
  const currentOpen = open ?? internalOpen
  const setCurrentOpen = onOpenChange ?? setInternalOpen
  const isCreateMode = mode === "create"
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ??
    categories[0]
  const categoryId = selectedCategory?.id ?? selectedCategoryId
  const categoryName = selectedCategory?.name ?? "Selected modifier group"
  const title = isCreateMode ? "Create modifier subgroup" : categoryName
  const description = isCreateMode
    ? "Add a reusable subgroup. Options can be added later."
    : "Update this modifier subgroup rule set."
  const submitLabel = isCreateMode ? "Create subgroup" : "Save subgroup"

  function handleOpenChange(nextOpen: boolean) {
    setCurrentOpen(nextOpen)
  }

  async function handleSubmit(formData: FormData) {
    if (isCreateMode) {
      await createModifierGroup(formData)
      const submittedCategoryId = String(formData.get("categoryId") ?? "")

      formRef.current?.reset()
      setCurrentOpen(false)
      onCreated?.(submittedCategoryId)
      router.refresh()
    } else {
      await updateModifierGroup(formData)
      const submittedCategoryId = String(formData.get("categoryId") ?? "")

      setCurrentOpen(false)
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
    setCurrentOpen(false)
    router.refresh()
  }

  return (
    <ThemedSheet open={currentOpen} onOpenChange={handleOpenChange}>
      {open === undefined ? (
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
      ) : null}

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
          key={`${mode}-${group?.id ?? "new"}`}
          ref={formRef}
          action={handleSubmit}
          className={MODIFIER_FORM_CLASS}
        >
          <div className={MODIFIER_FORM_BODY_CLASS}>
            {group ? (
              <input type="hidden" name="modifierGroupId" value={group.id} />
            ) : null}

            <input type="hidden" name="categoryId" value={categoryId} />

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <label className="block min-w-0 space-y-1.5 text-sm">
                <span className="font-medium">Subgroup name</span>
                <input
                  name="name"
                  defaultValue={group?.name ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  placeholder="Example: Pizza Cheese"
                  required
                />
              </label>

              {!isCreateMode && group ? (
                <ThemedButton
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`${group.is_enabled ? "Disable" : "Enable"} modifier subgroup ${group.name}`}
                  className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
                  onClick={() => void handleEnabledChange()}
                >
                  {group.is_enabled ? (
                    <ThumbsUp aria-hidden="true" />
                  ) : (
                    <ThumbsDown aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {group.is_enabled ? "Disable" : "Enable"} modifier subgroup
                  </span>
                </ThemedButton>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              <div className="col-span-2 grid grid-cols-2 gap-3">
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
              onClick={() => setCurrentOpen(false)}
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
