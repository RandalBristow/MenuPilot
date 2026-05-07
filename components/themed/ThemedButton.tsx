import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = React.ComponentProps<typeof Button>

export function ThemedButton({ className, ...props }: Props) {
  return (
    <Button
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      {...props}
    />
  )
}