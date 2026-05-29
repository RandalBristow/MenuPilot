"use client"

import { useState } from "react"
import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  deleteModifierOption,
  type DeleteModifierOptionResult,
} from "@/features/admin-modifiers/actions/delete-modifier-option"

type DeleteModifierOptionButtonProps = {
  optionId: string
  optionName: string
  modifierGroupId: string
  onResult?: (result: DeleteModifierOptionResult) => void
}

export function DeleteModifierOptionButton({
  optionId,
  optionName,
  modifierGroupId,
  onResult,
}: DeleteModifierOptionButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    const confirmed = window.confirm(
      `Delete this modifier option permanently?\n\n${optionName}`
    )

    if (!confirmed) return

    setIsDeleting(true)

    try {
      const formData = new FormData()
      formData.set("optionId", optionId)
      formData.set("modifierGroupId", modifierGroupId)

      const result = await deleteModifierOption(formData)

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
      aria-label={`Delete modifier option ${optionName}`}
      disabled={isDeleting}
      className="size-8 bg-destructive/10 text-destructive hover:bg-destructive/20"
      onClick={handleDelete}
    >
      <Trash2 aria-hidden="true" />
      <span className="sr-only">Delete modifier option</span>
    </ThemedButton>
  )
}
