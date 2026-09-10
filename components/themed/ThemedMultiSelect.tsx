"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type MultiSelectOption = { value: string; label: string }

export function ThemedMultiSelect({
  name,
  options,
  values,
  onChange,
  placeholder = "Select options",
  className,
}: {
  name: string
  options: MultiSelectOption[]
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}) {
  const selectedLabels = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label)

  function toggle(value: string, checked: boolean) {
    onChange(
      checked
        ? [...values, value]
        : values.filter((selected) => selected !== value)
    )
  }

  return (
    <details className={cn("group relative", className)}>
      <summary className="flex h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm [&::-webkit-details-marker]:hidden">
        <span className={cn("truncate", selectedLabels.length === 0 && "text-muted-foreground")}>
          {selectedLabels.length === 0
            ? placeholder
            : selectedLabels.length === 1
              ? selectedLabels[0]
              : `${selectedLabels.length} locations selected`}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-background p-2 shadow-lg">
        {options.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-muted">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={values.includes(option.value)}
              onChange={(event) => toggle(option.value, event.target.checked)}
              className="size-4"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </details>
  )
}
