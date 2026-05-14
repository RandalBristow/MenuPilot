import { cn } from "@/lib/utils"

type ThemedSectionHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title: React.ReactNode
  description?: React.ReactNode
  count?: React.ReactNode
  actions?: React.ReactNode
}

export function ThemedSectionHeader({
  title,
  description,
  count,
  actions,
  className,
  ...props
}: ThemedSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {count ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {count}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
