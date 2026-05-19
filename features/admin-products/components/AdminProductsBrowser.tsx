"use client"

import Link from "next/link"
import { ListTree, Plus, SlidersHorizontal } from "lucide-react"
import { useMemo, useState } from "react"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"

export type AdminProduct = {
  id: string
  name: string
  slug: string | null
  description: string | null
  base_price: number | null
  builder_template: string
  has_variants: boolean
  is_enabled: boolean
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b pb-1.5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
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
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-20 pt-3">
        {selectedParentGroup ? (
          visibleSections.length > 0 ? (
            <div className="space-y-3">
              {visibleSections.map((section) => (
                <section
                  key={section.id}
                  className="overflow-hidden rounded-md border bg-card"
                >
                  <div className="flex flex-col gap-1 border-b bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-end sm:justify-between sm:px-4">
                    <div>
                      <h3 className="text-lg font-semibold">{section.name}</h3>
                      {section.description ? (
                        <p className="text-sm text-muted-foreground">
                          {section.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {section.productGroups.length} products
                    </p>
                  </div>

                  {section.productGroups.length > 0 ? (
                    <div className="space-y-2 p-2.5 sm:p-3">
                      {section.productGroups.map(({ id, product }) => {
                        return (
                          <ThemedCard
                            key={id}
                            className="overflow-hidden border bg-background py-0"
                          >
                            <CompactRecordRow
                              title={
                                <Link
                                  href={`/admin/products/${product.id}`}
                                  aria-label={`Open product ${product.name}`}
                                  className="block truncate rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                  {product.name}
                                </Link>
                              }
                              statusIcon={
                                <CompactRecordStatusIcon
                                  enabled={product.is_enabled}
                                />
                              }
                              description={product.description}
                              rightAction={
                                <>
                                  <ThemedButton
                                    asChild
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label={`Manage variant assignment for ${product.name}`}
                                    className="size-8 bg-background text-foreground hover:bg-muted"
                                  >
                                    <Link
                                      href={`/admin/products/variant-assignments?productId=${product.id}`}
                                    >
                                      <ListTree aria-hidden="true" />
                                    </Link>
                                  </ThemedButton>
                                  <ThemedButton
                                    asChild
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label={`Manage modifier groups for ${product.name}`}
                                    className="size-8 bg-background text-foreground hover:bg-muted"
                                  >
                                    <Link
                                      href={`/admin/products/modifier-groups?productId=${product.id}`}
                                    >
                                      <SlidersHorizontal aria-hidden="true" />
                                    </Link>
                                  </ThemedButton>
                                </>
                              }
                            />
                          </ThemedCard>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="px-3 py-2.5 text-sm text-muted-foreground sm:px-4">
                      No products in this subcategory yet.
                    </p>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <p className="rounded-md border p-3 text-sm text-muted-foreground">
              No subcategories or products found for this category.
            </p>
          )
        ) : (
          <ThemedCard className="p-6 text-center">
            <p className="font-semibold">No menu categories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create menu groups before adding products.
            </p>
          </ThemedCard>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-6xl justify-end">
          <ThemedButton
            asChild
            size="icon"
            aria-label="New product"
            className="size-10 rounded-md p-0 shadow-sm sm:size-8"
          >
            <Link href="/admin/products/new">
              <Plus aria-hidden="true" />
            </Link>
          </ThemedButton>
        </div>
      </div>
    </div>
  )
}
