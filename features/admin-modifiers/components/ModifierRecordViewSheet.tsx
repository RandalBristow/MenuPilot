"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
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
  MODIFIER_FORM_FOOTER_CLASS,
  MODIFIER_FORM_SHEET_CONTENT_CLASS,
} from "@/features/admin-modifiers/components/modifier-form-panel-styles"

type ModifierRecordViewSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

export function ModifierRecordViewSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ModifierRecordViewSheetProps) {
  return (
    <ThemedSheet open={open} onOpenChange={onOpenChange}>
      <ThemedSheetContent
        side="bottom"
        className={MODIFIER_FORM_SHEET_CONTENT_CLASS}
      >
        <ThemedSheetHeader className="shrink-0">
          <ThemedSheetTitle>{title}</ThemedSheetTitle>
          {description ? (
            <ThemedSheetDescription>{description}</ThemedSheetDescription>
          ) : null}
        </ThemedSheetHeader>

        <div className={MODIFIER_FORM_BODY_CLASS}>{children}</div>

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
        </div>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}
