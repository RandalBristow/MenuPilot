import { cn } from "@/lib/utils"

type Props = React.HTMLAttributes<HTMLHeadingElement>

export function ThemedHeading({ className, ...props }: Props) {
  return (
    <h1
      className={cn(
        "font-heading text-2xl font-medium leading-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}
