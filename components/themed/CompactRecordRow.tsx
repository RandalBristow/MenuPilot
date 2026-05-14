import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type CompactRecordRowProps = {
  title: ReactNode
  statusIcon?: ReactNode
  description?: ReactNode
  metadata?: ReactNode
  leftAction?: ReactNode
  rightAction?: ReactNode
  className?: string
}

export function CompactRecordRow({
  title,
  statusIcon,
  description,
  metadata,
  leftAction,
  rightAction,
  className,
}: CompactRecordRowProps) {
  const hasActions = leftAction || rightAction

  return (
    <div className={cn("space-y-2 px-3 py-2.5", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {statusIcon ? (
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
            {statusIcon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">
          {title}
        </div>
      </div>

      {description ? (
        <div className="text-xs leading-5 text-muted-foreground">
          {description}
        </div>
      ) : null}

      {metadata ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {metadata}
        </div>
      ) : null}

      {hasActions ? (
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex min-w-0 items-center gap-2">{leftAction}</div>
          <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5">
            {rightAction}
          </div>
        </div>
      ) : null}
    </div>
  )
}
