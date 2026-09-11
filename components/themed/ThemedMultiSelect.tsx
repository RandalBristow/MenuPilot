"use client"

import { ChevronDown } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
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
    <div className={className}>
      {values.map((value) => <input key={value} type="hidden" name={name} value={value} />)}
      <PopoverPrimitive.Root>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            className="group flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm"
          >
            <span className={cn("truncate", selectedLabels.length === 0 && "text-muted-foreground")}>
              {selectedLabels.length === 0
                ? placeholder
                : selectedLabels.length === 1
                  ? selectedLabels[0]
                  : `${selectedLabels.length} locations selected`}
            </span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            side="bottom"
            sideOffset={4}
            collisionPadding={12}
            style={{ zIndex: 1000 }}
            className="max-h-64 w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
          >
            {options.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                <input
                  type="checkbox"
                  checked={values.includes(option.value)}
                  onChange={(event) => toggle(option.value, event.target.checked)}
                  className="size-4"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  )
}
