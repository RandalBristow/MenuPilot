"use client"

import type { ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ThemedConfirmDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ThemedConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isPending = false,
  onOpenChange,
  onConfirm,
}: ThemedConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] rounded-md border-border bg-card p-0 text-card-foreground sm:max-w-md"
      >
        <DialogHeader className="gap-3 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertTriangle aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2 leading-6">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="rounded-b-md bg-background p-3">
          <ThemedButton
            type="button"
            variant="outline"
            className="bg-background text-foreground hover:bg-muted"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </ThemedButton>
          <ThemedButton
            type="button"
            variant={destructive ? "destructive" : "default"}
            className={
              destructive
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : undefined
            }
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "Working..." : confirmLabel}
          </ThemedButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
