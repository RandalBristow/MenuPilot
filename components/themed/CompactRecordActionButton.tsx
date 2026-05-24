import type { ComponentProps, ReactNode } from "react"

import { ThemedButton } from "@/components/themed/ThemedButton"
import { cn } from "@/lib/utils"

type ThemedButtonProps = ComponentProps<typeof ThemedButton>

export type CompactRecordActionButtonProps = Omit<
  ThemedButtonProps,
  "aria-label" | "children" | "size"
> & {
  "aria-label": string
  children: ReactNode
}

export function CompactRecordActionButton({
  "aria-label": ariaLabel,
  children,
  className,
  variant = "outline",
  type = "button",
  ...props
}: CompactRecordActionButtonProps) {
  return (
    <ThemedButton
      aria-label={ariaLabel}
      type={type}
      variant={variant}
      size="icon"
      className={cn(
        "size-10 rounded-md border-border bg-card p-0 text-foreground shadow-sm shadow-foreground/5 hover:bg-muted sm:size-8",
        className
      )}
      {...props}
    >
      {children}
    </ThemedButton>
  )
}
