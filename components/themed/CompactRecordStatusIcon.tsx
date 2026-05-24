import { CircleCheck, CircleOff } from "lucide-react"

import { cn } from "@/lib/utils"

export type CompactRecordStatusIconProps = {
  enabled: boolean
  enabledLabel?: string
  disabledLabel?: string
  className?: string
}

export function CompactRecordStatusIcon({
  enabled,
  enabledLabel = "Enabled",
  disabledLabel = "Disabled",
  className,
}: CompactRecordStatusIconProps) {
  const label = enabled ? enabledLabel : disabledLabel
  const Icon = enabled ? CircleCheck : CircleOff

  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center",
        enabled ? "text-success" : "text-destructive",
        className
      )}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </span>
  )
}
