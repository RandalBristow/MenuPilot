"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"

export type AdminProductVariant = {
  id: string
  name: string
  base_price: number
  is_default: boolean
  is_enabled: boolean
  sort_order: number
}

export type AdminProduct = {
  id: string
  name: string
  slug: string | null
  description: string | null
  base_price: number | null
  builder_template: string
  has_variants: boolean
  is_enabled: boolean
  product_variants: AdminProductVariant[]
}

export type AdminProductGroup = {
  id: string
  sort_order: number
  product: AdminProduct | null
}

export type AdminMenuGroup = {
  id: string
  name: string
  slug: string | null
  description: string | null
  parent_group_id: string | null
  sort_order: number
  product_groups: AdminProductGroup[]
}

type ProductCategoryBrowserProps = {
  menuGroups: AdminMenuGroup[]
}

function sortBySortOrder<T extends { sort_order: number }>(items: T[]) {
  return [...items].sort((first, second) => first.sort_order - second.sort_order)
}

function getStartingPrice(product: AdminProduct) {
  if (product.has_variants && product.product_variants.length > 0) {
    return Math.min(
      ...product.product_variants.map((variant) => Number(variant.base_price))
    )
  }

  return product.base_price === null ? null : Number(product.base_price)
}

function formatPrice(product: AdminProduct) {
  const price = getStartingPrice(product)

  if (price === null) {
    return "Price varies"
  }

  return product.has_variants
    ? `Starting at $${price.toFixed(2)}`
    : `$${price.toFixed(2)}`
}

function getProductGroups(group: AdminMenuGroup) {
  return sortBySortOrder(group.product_groups)
    .map((productGroup) => ({
      id: productGroup.id,
      product: productGroup.product,
    }))
    .filter(
      (
        productGroup
      ): productGroup is { id: string; product: AdminProduct } =>
        productGroup.product !== null
    )
}

export function AdminProductsBrowser({
  menuGroups,
}: ProductCategoryBrowserProps) {
  const sortedGroups = useMemo(() => sortBySortOrder(menuGroups), [menuGroups])
  const parentGroups = sortedGroups.filter((group) => !group.parent_group_id)
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    parentGroups[0]?.id ?? ""
  )

  const selectedParentGroup =
    parentGroups.find((group) => group.id === selectedCategoryId) ??
    parentGroups[0] ??
    null

  const childGroups = selectedParentGroup
    ? sortedGroups.filter(
        (group) => group.parent_group_id === selectedParentGroup.id
      )
    : []

  const directProductGroups = selectedParentGroup
    ? getProductGroups(selectedParentGroup)
    : []

  const visibleSections = [
    ...childGroups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      productGroups: getProductGroups(group),
    })),
    ...(directProductGroups.length > 0
      ? [
          {
            id: `${selectedParentGroup?.id}-direct`,
            name: "Other",
            description: null,
            productGroups: directProductGroups,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {parentGroups.map((group) => {
            const isSelected = group.id === selectedParentGroup?.id

            return (
              <ThemedButton
                key={group.id}
                type="button"
                size="sm"
                onClick={() => setSelectedCategoryId(group.id)}
                className={
                  isSelected
                    ? "shrink-0"
                    : "shrink-0 bg-muted text-foreground hover:bg-muted/80"
                }
              >
                {group.name}
              </ThemedButton>
            )
          })}
        </div>

        <ThemedButton asChild className="sm:self-start">
          <Link href="/admin/products/new">New Product</Link>
        </ThemedButton>
      </div>

      {selectedParentGroup ? (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold">
              {selectedParentGroup.name}
            </h2>
            {selectedParentGroup.description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedParentGroup.description}
              </p>
            ) : null}
          </div>

          {visibleSections.length > 0 ? (
            visibleSections.map((section) => (
              <section key={section.id} className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">{section.name}</h3>
                  {section.description ? (
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  ) : null}
                </div>

                {section.productGroups.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {section.productGroups.map(({ id, product }) => (
                      <ThemedCard key={id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold">{product.name}</h4>
                            {product.description ? (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {product.description}
                              </p>
                            ) : null}
                          </div>

                          <span
                            className={
                              product.is_enabled
                                ? "shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                : "shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                            }
                          >
                            {product.is_enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold">
                            {formatPrice(product)}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {product.builder_template}
                          </span>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <ThemedButton asChild size="sm">
                            <Link href={`/admin/products/${product.id}`}>
                              Edit
                            </Link>
                          </ThemedButton>
                        </div>
                      </ThemedCard>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border p-3 text-sm text-muted-foreground">
                    No products in this subcategory yet.
                  </p>
                )}
              </section>
            ))
          ) : (
            <p className="rounded-md border p-3 text-sm text-muted-foreground">
              No subcategories or products found for this category.
            </p>
          )}
        </div>
      ) : (
        <ThemedCard className="p-6 text-center">
          <p className="font-semibold">No menu categories yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create menu groups before adding products.
          </p>
        </ThemedCard>
      )}
    </div>
  )
}
