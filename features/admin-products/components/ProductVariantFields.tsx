"use client"

import { useState } from "react"
import { ThemedButton } from "@/components/themed/ThemedButton"

export type ProductFormVariant = {
  id: string | null
  name: string
  base_price: number
  is_default: boolean
  is_enabled: boolean
  sort_order: number
}

type ProductVariantFieldsProps = {
  variants: ProductFormVariant[]
}

function createEmptyVariant(sortOrder: number): ProductFormVariant {
  return {
    id: null,
    name: "",
    base_price: 0,
    is_default: false,
    is_enabled: true,
    sort_order: sortOrder,
  }
}

export function ProductVariantFields({ variants }: ProductVariantFieldsProps) {
  const [rows, setRows] = useState<ProductFormVariant[]>(variants)
  const defaultIndex = rows.findIndex((variant) => variant.is_default)
  const selectedDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0

  function addVariantRow() {
    setRows((current) => [
      ...current,
      {
        ...createEmptyVariant(current.length),
        is_default: current.length === 0,
      },
    ])
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Variants</h2>
          <p className="text-sm text-muted-foreground">
            Add sizes or other priced options for this product.
          </p>
        </div>

        <ThemedButton type="button" onClick={addVariantRow}>
          Add Variant
        </ThemedButton>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          No variants. The product base price will be used.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((variant, index) => (
            <div key={variant.id ?? index} className="rounded-md border p-3">
              <input
                type="hidden"
                name="variantIds"
                value={variant.id ?? ""}
              />

              <div className="grid gap-3">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Variant name</span>
                  <input
                    name="variantNames"
                    required
                    defaultValue={variant.name}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Base price</span>
                    <input
                      name="variantBasePrices"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue={variant.base_price}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Sort order</span>
                    <input
                      name="variantSortOrders"
                      type="number"
                      min="0"
                      step="1"
                      required
                      defaultValue={variant.sort_order}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    name="variantIsEnabled"
                    defaultValue={variant.is_enabled ? "true" : "false"}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </label>
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="defaultVariantIndex"
                  value={index}
                  required
                  defaultChecked={index === selectedDefaultIndex}
                />
                Default variant
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
