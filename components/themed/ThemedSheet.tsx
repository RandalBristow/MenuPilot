import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type ThemedSheetContentProps = React.ComponentProps<typeof SheetContent>

function ThemedSheetContent({
  className,
  ...props
}: ThemedSheetContentProps) {
  return (
    <SheetContent
      className={cn(
        "border-border bg-popover text-popover-foreground shadow-xl shadow-foreground/10",
        className
      )}
      {...props}
    />
  )
}

export {
  Sheet as ThemedSheet,
  ThemedSheetContent,
  SheetDescription as ThemedSheetDescription,
  SheetHeader as ThemedSheetHeader,
  SheetTitle as ThemedSheetTitle,
  SheetTrigger as ThemedSheetTrigger,
}
