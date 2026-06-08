"use client"

import { useId, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type ThemedAccordionItem = {
  id: string
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  disabled?: boolean
  content: ReactNode
}

type ThemedAccordionProps = {
  items: ThemedAccordionItem[]
  defaultOpenIds?: string[]
  openIds?: string[]
  onOpenIdsChange?: (openIds: string[]) => void
  allowMultiple?: boolean
  compact?: boolean
  keepMounted?: boolean
  className?: string
}

export function ThemedAccordion({
  items,
  defaultOpenIds = [],
  openIds,
  onOpenIdsChange,
  allowMultiple = true,
  compact = false,
  keepMounted = false,
  className,
}: ThemedAccordionProps) {
  const baseId = useId()
  const [uncontrolledOpenIds, setUncontrolledOpenIds] =
    useState<string[]>(defaultOpenIds)
  const activeOpenIds = openIds ?? uncontrolledOpenIds

  function setNextOpenIds(nextOpenIds: string[]) {
    onOpenIdsChange?.(nextOpenIds)

    if (!openIds) {
      setUncontrolledOpenIds(nextOpenIds)
    }
  }

  function toggleItem(item: ThemedAccordionItem) {
    if (item.disabled) return

    const isOpen = activeOpenIds.includes(item.id)
    const nextOpenIds = isOpen
      ? activeOpenIds.filter((openId) => openId !== item.id)
      : allowMultiple
        ? [...activeOpenIds, item.id]
        : [item.id]

    setNextOpenIds(nextOpenIds)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => {
        const isOpen = activeOpenIds.includes(item.id)
        const triggerId = `${baseId}-${item.id}-trigger`
        const contentId = `${baseId}-${item.id}-content`

        return (
          <section
            key={item.id}
            className={cn(
              "overflow-hidden rounded-md border bg-card text-card-foreground",
              isOpen ? "border-accent/60 bg-accent/10" : "border-border",
              item.disabled ? "opacity-60" : undefined
            )}
          >
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              disabled={item.disabled}
              onClick={() => toggleItem(item)}
              className={cn(
                "flex w-full items-center gap-3 text-left",
                compact ? "min-h-11 px-3 py-2" : "min-h-12 px-3 py-2.5"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {item.title}
                </div>
                {item.subtitle ? (
                  <div className="mt-0.5 text-xs leading-4 text-muted-foreground">
                    {item.subtitle}
                  </div>
                ) : null}
              </div>

              {item.meta ? (
                <div className="shrink-0 text-xs font-medium text-muted-foreground">
                  {item.meta}
                </div>
              ) : null}

              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen ? "rotate-180" : undefined
                )}
              />
            </button>

            {isOpen || keepMounted ? (
              <div
                id={contentId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className="border-t border-border/70 bg-card px-2.5 py-2.5"
              >
                {item.content}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
