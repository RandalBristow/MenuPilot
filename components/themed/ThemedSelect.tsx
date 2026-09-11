"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const EMPTY_VALUE = "__menupilot_empty_select_value__"

type Props = {
  children: React.ReactNode
  name?: string
  value?: string | number | readonly string[]
  defaultValue?: string | number | readonly string[]
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  "aria-label"?: string
}

type OptionProps = {
  value?: string | number | readonly string[]
  disabled?: boolean
  children?: React.ReactNode
}

function scalar(value: Props["value"]) {
  if (Array.isArray(value)) return String(value[0] ?? "")
  return value == null ? "" : String(value)
}

export function ThemedSelect({
  children,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  className,
  id,
  "aria-label": ariaLabel,
}: Props) {
  const controlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState(() => scalar(defaultValue))
  const selectedValue = controlled ? scalar(value) : internalValue
  const radixValue = selectedValue === "" ? EMPTY_VALUE : selectedValue
  const options = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<OptionProps> => React.isValidElement(child)
  )

  function change(nextValue: string) {
    const decodedValue = nextValue === EMPTY_VALUE ? "" : nextValue
    if (!controlled) setInternalValue(decodedValue)
    onChange?.({ target: { value: decodedValue }, currentTarget: { value: decodedValue } } as unknown as React.ChangeEvent<HTMLSelectElement>)
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      <Select value={radixValue} onValueChange={change} disabled={disabled} required={required}>
        <SelectTrigger id={id} aria-label={ariaLabel} className={cn("h-10! w-full rounded-md bg-background px-3", className)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {options.map((option, index) => {
            const optionValue = scalar(option.props.value)
            return (
              <SelectItem
                key={option.key ?? `${optionValue}-${index}`}
                value={optionValue === "" ? EMPTY_VALUE : optionValue}
                disabled={option.props.disabled}
              >
                {option.props.children}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </>
  )
}
