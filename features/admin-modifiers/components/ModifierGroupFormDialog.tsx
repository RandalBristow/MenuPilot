"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createModifierGroup } from "@/features/admin-modifiers/actions/create-modifier-group"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
  ThemedSheetTrigger,
} from "@/components/themed/ThemedSheet"
import type { ModifierGroupCategory } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

type ModifierGroupFormMode = "create"

type ModifierGroupFormDialogProps = {
  categories: ModifierGroupCategory[]
  selectedCategoryId: string
  mode?: ModifierGroupFormMode
  onCreated?: (categoryId: string) => void
}

export function ModifierGroupFormDialog({
  categories,
  selectedCategoryId,
  mode = "create",
  onCreated,
}: ModifierGroupFormDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [categoryId, setCategoryId] = useState(selectedCategoryId)
  const isCreateMode = mode === "create"

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
    }
  }

  return (
    <ThemedSheet open={open} onOpenChange={handleOpenChange}>
      <ThemedSheetTrigger asChild>
        <ThemedButton type="button" className="w-full sm:w-auto">
          Add Group
        </ThemedButton>
      </ThemedSheetTrigger>

      <ThemedSheetContent side="right" className="w-full sm:max-w-xl">
        <ThemedSheetHeader>
          <ThemedSheetTitle>Create modifier group</ThemedSheetTitle>
          <ThemedSheetDescription>
            Add a modifier group to a category. Options can be added later.
          </ThemedSheetDescription>
        </ThemedSheetHeader>

        <form ref={formRef} action={handleSubmit} className="mt-6 space-y-4">
          <label className="space-y-1.5 text-sm">
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

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Group name</span>
            <input
              name="name"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="Example: Pizza Cheese"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Selection</span>
              <select
                name="selectionType"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue="single"
                required
              >
                <option value="single">Single</option>
                <option value="multiple">Multiple</option>
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Required</span>
              <select
                name="isRequired"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue="false"
                required
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Min</span>
              <input
                name="minRequired"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                required
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Max</span>
              <input
                name="maxAllowed"
                type="number"
                min="0"
                step="1"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                placeholder="No max"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <ThemedButton
              type="button"
              variant="outline"
              className="bg-background text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Cancel
            </ThemedButton>
            <ThemedButton type="submit">Create group</ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}
