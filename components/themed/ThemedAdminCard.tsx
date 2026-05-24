import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ThemedAdminCardProps = React.ComponentProps<typeof Card>

export function ThemedAdminCard({
  className,
  ...props
}: ThemedAdminCardProps) {
  return (
    <Card
      className={cn(
        "border border-border bg-card p-3 text-card-foreground shadow-sm shadow-foreground/5 sm:p-4",
        className
      )}
      {...props}
    />
  )
}
