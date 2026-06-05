"use client"

import { useState } from "react"
import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
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
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    const confirmed = window.confirm(
      `Delete this modifier option list permanently?\n\n${optionGroupName}\n\nAll modifier options in this list will also be deleted.`
    )

    if (!confirmed) return

    setIsDeleting(true)

    try {
      const formData = new FormData()
      if (businessSlug) formData.set("businessSlug", businessSlug)
      formData.set("modifierGroupId", modifierGroupId)
      formData.set("modifierOptionGroupId", modifierOptionGroupId)

      const result = await deleteModifierOptionGroup(formData)

      onResult?.(result)

      if (result.status === "deleted") {
        router.refresh()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ThemedButton
      type="button"
      size="icon"
      variant="destructive"
      aria-label={`Delete modifier option list ${optionGroupName}`}
      disabled={isDeleting}
      className="size-8 bg-destructive/10 text-destructive hover:bg-destructive/20"
      onClick={handleDelete}
    >
      <Trash2 aria-hidden="true" />
      <span className="sr-only">Delete modifier option list</span>
    </ThemedButton>
  )
}
