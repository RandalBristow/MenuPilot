"use client"

import { useState } from "react"
import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedConfirmDialog } from "@/components/themed/ThemedConfirmDialog"
import { useThemedToast } from "@/components/themed/ThemedToastProvider"
import {
  deleteModifierOptionGroup,
  type DeleteModifierOptionGroupResult,
} from "@/features/admin-modifiers/actions/delete-modifier-option-group"

type DeleteModifierOptionGroupButtonProps = {
  businessSlug?: string
  modifierGroupId: string
  modifierOptionGroupId: string
  optionGroupName: string
  onResult?: (result: DeleteModifierOptionGroupResult) => void
}

export function DeleteModifierOptionGroupButton({
  businessSlug,
  modifierGroupId,
  modifierOptionGroupId,
  optionGroupName,
  onResult,
}: DeleteModifierOptionGroupButtonProps) {
  const router = useRouter()
  const { showToast } = useThemedToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDeleteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    setIsDeleting(true)

    try {
      const formData = new FormData()
      if (businessSlug) formData.set("businessSlug", businessSlug)
      formData.set("modifierGroupId", modifierGroupId)
      formData.set("modifierOptionGroupId", modifierOptionGroupId)

      const result = await deleteModifierOptionGroup(formData)

      onResult?.(result)

      if (result.status === "deleted") {
        setConfirmOpen(false)
        showToast({
          kind: "success",
          title: "Modifier option list deleted.",
          description: optionGroupName,
        })
        router.refresh()
      } else {
        showToast({
          kind: "error",
          title: "Modifier option list was not deleted.",
          description: result.message,
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <ThemedButton
        type="button"
        size="icon"
        variant="destructive"
        aria-label={`Delete modifier option list ${optionGroupName}`}
        disabled={isDeleting}
        className="size-8 bg-destructive/10 text-destructive hover:bg-destructive/20"
        onClick={handleDeleteClick}
      >
        <Trash2 aria-hidden="true" />
        <span className="sr-only">Delete modifier option list</span>
      </ThemedButton>
      <ThemedConfirmDialog
        open={confirmOpen}
        title="Delete modifier option list?"
        description={
          <>
            <span className="block font-medium text-foreground">
              {optionGroupName}
            </span>
            <span className="mt-1 block">
              All modifier options in this list will also be deleted.
            </span>
          </>
        }
        confirmLabel="Delete"
        destructive
        isPending={isDeleting}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  )
}
