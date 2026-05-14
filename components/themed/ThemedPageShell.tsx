import { cn } from "@/lib/utils"

type ThemedPageShellProps = React.HTMLAttributes<HTMLElement> & {
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full"
}

const maxWidthClasses: Record<NonNullable<ThemedPageShellProps["maxWidth"]>, string> = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-none",
}

export function ThemedPageShell({
  children,
  className,
  maxWidth = "xl",
  ...props
}: ThemedPageShellProps) {
  return (
    <main
      className={cn("min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8", className)}
      {...props}
    >
      <div className={cn("mx-auto space-y-5", maxWidthClasses[maxWidth])}>
        {children}
      </div>
    </main>
  )
}
