"use client"

import { Switch } from "@/components/ui/switch"

type ThemedSwitchProps = React.ComponentProps<typeof Switch> & {
  label: string
  description?: string
}

export function ThemedSwitch({ label, description, ...props }: ThemedSwitchProps) {
  return (
    <label className="flex w-fit items-start gap-3">
      <span className="text-sm">
        <span className="block font-medium">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <Switch aria-label={label} {...props} />
    </label>
  )
}
