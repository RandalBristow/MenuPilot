"use client"

import { ThumbsDown, ThumbsUp } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"

type ModifierStatusToggleControlProps = {
  enabled: boolean
  name: string
  entityLabel: string
  onToggle: () => void
}

export function ModifierStatusToggleControl({
  enabled,
  name,
  entityLabel,
  onToggle,
}: ModifierStatusToggleControlProps) {
  const nextStatusLabel = enabled ? "Disable" : "Enable"

  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CompactRecordStatusIcon enabled={enabled} />
          <div className="min-w-0">
            <p className="text-sm font-medium">Status</p>
            <p className="text-xs text-muted-foreground">
              {enabled ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>

        <ThemedButton
          type="button"
          variant="outline"
          size="icon"
          aria-label={`${nextStatusLabel} ${entityLabel} ${name}`}
          className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
          onClick={onToggle}
        >
          {enabled ? (
            <ThumbsUp aria-hidden="true" />
          ) : (
            <ThumbsDown aria-hidden="true" />
          )}
          <span className="sr-only">
            {nextStatusLabel} {entityLabel}
          </span>
        </ThemedButton>
      </div>
    </div>
  )
}
