"use client"

import { useState } from "react"
import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedConfirmDialog } from "@/components/themed/ThemedConfirmDialog"
import { useThemedToast } from "@/components/themed/ThemedToastProvider"
import {
  deleteModifierOption,
  type DeleteModifierOptionResult,
} from "@/features/admin-modifiers/actions/delete-modifier-option"

type DeleteModifierOptionButtonProps = {
  businessSlug?: string
  optionId: string
  optionName: string
  modifierGroupId: string
  onResult?: (result: DeleteModifierOptionResult) => void
}

export function DeleteModifierOptionButton({
  businessSlug,
  optionId,
  optionName,
  modifierGroupId,
  onResult,
}: DeleteModifierOptionButtonProps) {
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
      formData.set("optionId", optionId)
      formData.set("modifierGroupId", modifierGroupId)

      const result = await deleteModifierOption(formData)

      onResult?.(result)

      if (result.status === "deleted") {
        setConfirmOpen(false)
        showToast({
          kind: "success",
          title: "Modifier option deleted.",
          description: optionName,
        })
        router.refresh()
      } else {
        showToast({
          kind: "error",
          title: "Modifier option was not deleted.",
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
        aria-label={`Delete modifier option ${optionName}`}
        disabled={isDeleting}
        className="size-8 bg-destructive/10 text-destructive hover:bg-destructive/20"
        onClick={handleDeleteClick}
      >
        <Trash2 aria-hidden="true" />
        <span className="sr-only">Delete modifier option</span>
      </ThemedButton>
      <ThemedConfirmDialog
        open={confirmOpen}
        title="Delete modifier option?"
        description={
          <>
            <span className="block font-medium text-foreground">
              {optionName}
            </span>
            <span className="mt-1 block">
              Product defaults, availability rules, and price overrides for this
              option will also be removed. Options already saved in order history
              are protected.
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
