import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Props = React.ComponentProps<typeof Card>

export function ThemedCard({ className, ...props }: Props) {
  return (
    <Card
      className={cn(
        "bg-card text-card-foreground border border-border",
        className
      )}
      {...props}
    />
  )
}