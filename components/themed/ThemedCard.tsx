import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Props = React.ComponentProps<typeof Card>

export function ThemedCard({ className, ...props }: Props) {
  return (
    <Card
      className={cn(
        "border border-border bg-card text-card-foreground shadow-sm shadow-foreground/5",
        className
      )}
      {...props}
    />
  )
}
