"use client"

import type { ReactNode } from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { createModifierCategory } from "@/features/admin-modifiers/actions/create-modifier-category"
import { setModifierCategoryEnabled } from "@/features/admin-modifiers/actions/set-modifier-category-enabled"
import { updateModifierCategory } from "@/features/admin-modifiers/actions/update-modifier-category"
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

type ModifierCategoryFormMode = "create" | "edit"

type ModifierCategoryFormDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  mode?: ModifierCategoryFormMode
  category?: ModifierGroupCategory
  triggerLabel?: string
  triggerIcon?: ReactNode
  triggerAriaLabel?: string
  onSaved?: (categoryId?: string) => void
}

export function ModifierCategoryFormDialog({
  open,
  onOpenChange,
  mode = "create",
  category,
  triggerLabel,
  triggerIcon,
  triggerAriaLabel,
  onSaved,
}: ModifierCategoryFormDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [internalOpen, setInternalOpen] = useState(false)
  const currentOpen = open ?? internalOpen
  const setCurrentOpen = onOpenChange ?? setInternalOpen
  const isCreateMode = mode === "create"
  const title = isCreateMode
    ? "Create modifier group"
    : (category?.name ?? "Edit modifier group")
  const description = isCreateMode
    ? "Add a top-level group for organizing modifier subgroups."
    : "Update this modifier group."
  const submitLabel = isCreateMode ? "Create modifier group" : "Save modifier group"

  async function handleSubmit(formData: FormData) {
    if (isCreateMode) {
      await createModifierCategory(formData)
    } else {
      await updateModifierCategory(formData)
    }

    formRef.current?.reset()
    setCurrentOpen(false)
    onSaved?.(category?.id)
    router.refresh()
  }

  async function handleEnabledChange() {
    if (!category) return

    const formData = new FormData()
    formData.set("categoryId", category.id)
    formData.set("isEnabled", String(!category.is_enabled))

    await setModifierCategoryEnabled(formData)
    setCurrentOpen(false)
    router.refresh()
  }

  return (
    <ThemedSheet open={currentOpen} onOpenChange={setCurrentOpen}>
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
              (triggerLabel ??
                (isCreateMode ? "Add Modifier Group" : "Edit Modifier Group"))}
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
          key={`${mode}-${category?.id ?? "new"}`}
          ref={formRef}
          action={handleSubmit}
          className={MODIFIER_FORM_CLASS}
        >
          <div className={MODIFIER_FORM_BODY_CLASS}>
            {category ? (
              <input type="hidden" name="categoryId" value={category.id} />
            ) : null}

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <label className="block min-w-0 space-y-1.5 text-sm">
                <span className="font-medium">Modifier group name</span>
                <input
                  name="name"
                  defaultValue={category?.name ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  placeholder="Example: Pizza"
                  required
                />
              </label>

              {!isCreateMode && category ? (
                <ThemedButton
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`${category.is_enabled ? "Disable" : "Enable"} modifier group ${category.name}`}
                  className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
                  onClick={() => void handleEnabledChange()}
                >
                  {category.is_enabled ? (
                    <ThumbsUp aria-hidden="true" />
                  ) : (
                    <ThumbsDown aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {category.is_enabled ? "Disable" : "Enable"} modifier group
                  </span>
                </ThemedButton>
              ) : null}
            </div>

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Description</span>
              <textarea
                name="description"
                defaultValue={category?.description ?? ""}
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Optional description."
              />
            </label>
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
