import { cn } from "@/lib/utils"

type Props = React.HTMLAttributes<HTMLHeadingElement>

export function ThemedHeading({ className, ...props }: Props) {
  return (
    <h1
      className={cn(
        "text-3xl font-bold text-foreground",
        className
      )}
      {...props}
    />
  )
}