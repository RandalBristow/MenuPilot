"use client"

import { useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedAccordion,
  type ThemedAccordionItem,
} from "@/components/themed/ThemedAccordion"
import type {
  SpecialAdminFormData,
  SpecialAdminListItem,
} from "@/features/specials/queries/get-specials-admin-data"
import type { OrderableDealComponentPricingMode } from "@/features/specials/types/orderable-deal"
import type { SpecialType } from "@/features/specials/types/special"
import { cn } from "@/lib/utils"

type AdminComponentPricingMode = Exclude<
  OrderableDealComponentPricingMode,
  "normal_price"
>

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

type ComponentDraft = {
  key: string
  label: string
  description: string
  sortOrder: number
  requiredQuantity: number
  minQuantity: number
  maxQuantity: number
  pricingMode: AdminComponentPricingMode
  fixedPrice: string
  productIds: string[]
  productVariantRestrictions: Record<string, string[]>
  modifierGroupOverrides: Record<string, Record<string, string>>
}

type MixMatchDraft = {
  minQuantity: number
  maxQuantity: number | null
  unitPrice: number
  allowExtraItems: boolean
  productIds: string[]
  productVariantRestrictions: Record<string, string[]>
  modifierGroupOverrides: Record<string, Record<string, string>>
}

type ProductOption = SpecialAdminFormData["products"][number]

type ProductCategoryGroup = {
  id: string
  name: string
  sortOrder: number
  subcategories: ProductSubcategoryGroup[]
}

type ProductSubcategoryGroup = {
  id: string
  name: string
  sortOrder: number
  products: ProductOption[]
}

const UNCATEGORIZED_CATEGORY_ID = "uncategorized"
const UNCATEGORIZED_SUBCATEGORY_ID = "uncategorized-products"

function formatDateTimeInput(value: string | null | undefined) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toISOString().slice(0, 16)
}

function parseAdminComponentPricingMode(value: string): AdminComponentPricingMode {
  return value === "fixed_price" ? "fixed_price" : "included"
}

function getWindowForDay(special: SpecialAdminListItem | null, day: number) {
  return special?.availabilityWindows.find((window) => window.dayOfWeek === day)
}

function buildInitialComponents(
  special: SpecialAdminListItem | null
): ComponentDraft[] {
  if (!special?.components.length) {
    return [
      {
        key: "component-1",
        label: "",
        description: "",
        sortOrder: 1,
        requiredQuantity: 1,
        minQuantity: 1,
        maxQuantity: 1,
        pricingMode: "included",
        fixedPrice: "",
        productIds: [],
        productVariantRestrictions: {},
        modifierGroupOverrides: {},
      },
    ]
  }

  return special.components.map((component, index) => ({
    key: component.id || `component-${index + 1}`,
    label: component.label,
    description: component.description ?? "",
    sortOrder: component.sortOrder || index + 1,
    requiredQuantity: component.requiredQuantity,
    minQuantity: component.minQuantity,
    maxQuantity: component.maxQuantity,
    pricingMode:
      component.pricingMode === "fixed_price" ? "fixed_price" : "included",
    fixedPrice:
      component.fixedPrice === null || component.fixedPrice === undefined
        ? ""
        : String(component.fixedPrice),
    productIds: component.productIds,
    productVariantRestrictions: Object.fromEntries(
      component.productVariantRestrictions.map((restriction) => [
        restriction.productId,
        restriction.allowedVariantOptionIds,
      ])
    ),
    modifierGroupOverrides: (component.modifierGroupOverrides ?? []).reduce<
      Record<string, Record<string, string>>
    >((overrides, override) => {
      const productOverrides = overrides[override.productId] ?? {}

      return {
        ...overrides,
        [override.productId]: {
          ...productOverrides,
          [override.modifierGroupId]: String(override.includedSelectionCount),
        },
      }
    }, {}),
  }))
}

function buildInitialMixMatch(
  special: SpecialAdminListItem | null
): MixMatchDraft {
  const rule = special?.mixMatchRule

  if (!rule) {
    return {
      minQuantity: 2,
      maxQuantity: null,
      unitPrice: 0,
      allowExtraItems: true,
      productIds: [],
      productVariantRestrictions: {},
      modifierGroupOverrides: {},
    }
  }

  return {
    minQuantity: rule.minQuantity,
    maxQuantity: rule.maxQuantity,
    unitPrice: rule.unitPrice,
    allowExtraItems: rule.allowExtraItems,
    productIds: rule.productIds,
    productVariantRestrictions: Object.fromEntries(
      rule.productVariantRestrictions.map((restriction) => [
        restriction.productId,
        restriction.allowedVariantOptionIds,
      ])
    ),
    modifierGroupOverrides: rule.modifierGroupOverrides.reduce<
      Record<string, Record<string, string>>
    >((overrides, override) => {
      const productOverrides = overrides[override.productId] ?? {}

      return {
        ...overrides,
        [override.productId]: {
          ...productOverrides,
          [override.modifierGroupId]: String(override.includedSelectionCount),
        },
      }
    }, {}),
  }
}

function formatSelectedProductSummary({
  products,
  selectedIds,
}: {
  products: ProductOption[]
  selectedIds: string[]
}) {
  const selectedProducts = selectedIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is ProductOption => Boolean(product))
  const count = selectedIds.length
  const countText = `${count} allowed ${count === 1 ? "product" : "products"}`

  if (selectedProducts.length === 0) return countText

  const names = selectedProducts.slice(0, 3).map((product) => product.name)
  const suffix = selectedProducts.length > 3 ? "..." : ""

  return `${countText}: ${names.join(", ")}${suffix}`
}

function groupProductsByCategory(products: ProductOption[]): ProductCategoryGroup[] {
  const categories = new Map<string, ProductCategoryGroup>()

  products.forEach((product) => {
    const categoryId =
      product.parentMenuGroupId ?? product.menuGroupId ?? UNCATEGORIZED_CATEGORY_ID
    const categoryName =
      product.parentMenuGroupName ??
      product.menuGroupName ??
      "Uncategorized"
    const categorySort = product.parentMenuGroupSortOrder ?? 9999
    const subcategoryId =
      product.menuGroupId ?? `${categoryId}-${UNCATEGORIZED_SUBCATEGORY_ID}`
    const subcategoryName =
      product.menuGroupName ??
      (categoryId === UNCATEGORIZED_CATEGORY_ID ? "Uncategorized" : categoryName)
    const subcategorySort = product.menuGroupSortOrder ?? categorySort
    const category = categories.get(categoryId) ?? {
      id: categoryId,
      name: categoryName,
      sortOrder: categorySort,
      subcategories: [],
    }
    let subcategory = category.subcategories.find(
      (item) => item.id === subcategoryId
    )

    if (!subcategory) {
      subcategory = {
        id: subcategoryId,
        name: subcategoryName,
        sortOrder: subcategorySort,
        products: [],
      }
      category.subcategories.push(subcategory)
    }

    subcategory.products.push(product)
    categories.set(categoryId, category)
  })

  return [...categories.values()]
    .map((category) => ({
      ...category,
      subcategories: category.subcategories
        .map((subcategory) => ({
          ...subcategory,
          products: [...subcategory.products].sort((first, second) =>
            first.name.localeCompare(second.name)
          ),
        }))
        .sort((first, second) => {
          if (first.sortOrder !== second.sortOrder) {
            return first.sortOrder - second.sortOrder
          }

          return first.name.localeCompare(second.name)
        }),
    }))
    .sort((first, second) => {
      if (first.sortOrder !== second.sortOrder) {
        return first.sortOrder - second.sortOrder
      }

      return first.name.localeCompare(second.name)
    })
}

function EligibilityCheckboxes({
  title,
  name,
  options,
  selectedIds,
}: {
  title: string
  name: string
  options: Array<{ id: string; name: string; isEnabled: boolean }>
  selectedIds: string[]
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{title}</legend>
      <div className="grid gap-2 rounded-md border bg-background p-3">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">No options yet.</p>
        ) : (
          options.map((option) => (
            <label key={option.id} className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name={name}
                value={option.id}
                defaultChecked={selectedIds.includes(option.id)}
                className="mt-1 size-4 shrink-0"
              />
              <span className="min-w-0">
                <span className="block truncate font-medium">{option.name}</span>
                {!option.isEnabled ? (
                  <span className="block text-xs text-muted-foreground">
                    Disabled
                  </span>
                ) : null}
              </span>
            </label>
          ))
        )}
      </div>
    </fieldset>
  )
}

function AvailabilityFields({ special }: { special: SpecialAdminListItem | null }) {
  const hasWindows = (special?.availabilityWindows ?? []).length > 0

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">Availability</legend>
      <label className="grid gap-2">
        <span className="text-xs text-muted-foreground">Mode</span>
        <select
          name="availabilityMode"
          defaultValue={hasWindows ? "specific" : "always"}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="always">Always available during date range</option>
          <option value="specific">Specific days and times</option>
        </select>
      </label>

      <div className="grid gap-2 rounded-md border bg-background p-3">
        {DAY_LABELS.map((label, day) => {
          const window = getWindowForDay(special, day)

          return (
            <div key={label} className="grid gap-2 rounded-md border p-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name={`availabilityDay-${day}`}
                  value="true"
                  defaultChecked={Boolean(window)}
                  className="size-4 shrink-0"
                />
                {label}
              </label>
              <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`availabilityAllDay-${day}`}
                    value="true"
                    defaultChecked={window?.isAllDay ?? false}
                    className="size-4 shrink-0"
                  />
                  All day
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-muted-foreground">Start</span>
                  <input
                    type="time"
                    name={`availabilityStart-${day}`}
                    defaultValue={window?.startTime?.slice(0, 5) ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-muted-foreground">End</span>
                  <input
                    type="time"
                    name={`availabilityEnd-${day}`}
                    defaultValue={window?.endTime?.slice(0, 5) ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

function ComponentProductPicker({
  title = "Allowed products",
  helperText,
  inputName,
  variantInputNamePrefix,
  modifierOverrideInputNamePrefix,
  products,
  selectedIds,
  selectedVariantRestrictions,
  selectedModifierGroupOverrides,
  onSelectedIdsChange,
  onVariantRestrictionsChange,
  onModifierGroupOverrideChange,
}: {
  title?: string
  helperText?: string
  inputName: string
  variantInputNamePrefix: string
  modifierOverrideInputNamePrefix: string
  products: ProductOption[]
  selectedIds: string[]
  selectedVariantRestrictions: Record<string, string[]>
  selectedModifierGroupOverrides: Record<string, Record<string, string>>
  onSelectedIdsChange: (selectedIds: string[]) => void
  onVariantRestrictionsChange: (
    productId: string,
    allowedVariantOptionIds: string[]
  ) => void
  onModifierGroupOverrideChange: (
    productId: string,
    modifierGroupId: string,
    includedSelectionCount: string
  ) => void
}) {
  const categories = groupProductsByCategory(products)
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? ""
  )
  const visibleCategories = categories.filter(
    (category) => category.id === selectedCategoryId
  )
  const visibleProducts = visibleCategories.flatMap((category) =>
    category.subcategories.flatMap((subcategory) => subcategory.products)
  )
  const selectedSet = new Set(selectedIds)

  function toggleProduct(productId: string) {
    if (selectedSet.has(productId)) {
      onVariantRestrictionsChange(productId, [])
      onSelectedIdsChange(selectedIds.filter((id) => id !== productId))
      return
    }

    onSelectedIdsChange([...selectedIds, productId])
  }

  function toggleVariantRestriction(productId: string, variantId: string) {
    const currentVariantIds = selectedVariantRestrictions[productId] ?? []
    const nextVariantIds = currentVariantIds.includes(variantId)
      ? currentVariantIds.filter((id) => id !== variantId)
      : [...currentVariantIds, variantId]

    onVariantRestrictionsChange(productId, nextVariantIds)
  }

  function getVariantRestrictionSummary(product: ProductOption) {
    const selectedVariantIds = selectedVariantRestrictions[product.id] ?? []

    if (product.variants.length === 0) return null
    if (selectedVariantIds.length === 0) return "All variants allowed."

    const selectedVariantNames = selectedVariantIds
      .map((id) => product.variants.find((variant) => variant.id === id)?.name)
      .filter((name): name is string => Boolean(name))

    return `${selectedVariantNames.join(", ")} only.`
  }

  function selectSubcategoryProducts(productsToSelect: ProductOption[]) {
    onSelectedIdsChange([
      ...selectedIds,
      ...productsToSelect
        .map((product) => product.id)
        .filter((id) => !selectedSet.has(id)),
    ])
  }

  function clearSubcategoryProducts(productsToClear: ProductOption[]) {
    const idsToClear = new Set(productsToClear.map((product) => product.id))

    onSelectedIdsChange(selectedIds.filter((id) => !idsToClear.has(id)))
  }

  const accordionItems: ThemedAccordionItem[] = visibleCategories.flatMap(
    (category) =>
      category.subcategories.map((subcategory) => {
        const selectedCount = subcategory.products.filter((product) =>
          selectedSet.has(product.id)
        ).length

        return {
          id: `${category.id}-${subcategory.id}`,
          title: subcategory.name,
          meta: `${selectedCount}/${subcategory.products.length}`,
          content: (
            <div className="grid gap-2">
              <div className="flex flex-wrap justify-end gap-2">
                <ThemedButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectSubcategoryProducts(subcategory.products)}
                >
                  Select visible
                </ThemedButton>
                <ThemedButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => clearSubcategoryProducts(subcategory.products)}
                >
                  Clear visible
                </ThemedButton>
              </div>

              <div className="grid gap-2">
                {subcategory.products.map((product) => {
                  const isSelected = selectedSet.has(product.id)
                  const variantSummary = getVariantRestrictionSummary(product)

                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "grid gap-2 rounded-md border px-3 py-2 text-sm",
                        isSelected
                          ? "border-accent bg-accent/20"
                          : "border-border bg-background"
                      )}
                    >
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleProduct(product.id)}
                        className="grid min-h-8 grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-2 text-left"
                      >
                        <span className="flex size-5 items-center justify-center">
                          {isSelected ? (
                            <Check aria-hidden="true" className="size-5" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {product.name}
                          </span>
                          {!product.isEnabled ? (
                            <span className="block text-xs text-muted-foreground">
                              Disabled
                            </span>
                          ) : null}
                          {variantSummary ? (
                            <span className="block text-xs text-muted-foreground">
                              {variantSummary}
                            </span>
                          ) : null}
                        </span>
                      </button>

                      {isSelected && product.variants.length > 0 ? (
                        <div className="ml-7 grid gap-2 border-t border-border/60 pt-2">
                          <span className="block text-xs text-muted-foreground">
                            Variants. If none are selected, all variants are allowed.
                          </span>
                          <div className="grid gap-1.5">
                            {product.variants.map((variant) => {
                              const checked = (
                                selectedVariantRestrictions[product.id] ?? []
                              ).includes(variant.id)

                              return (
                                <label
                                  key={variant.id}
                                  className="flex min-h-9 items-center gap-2 rounded-md border bg-background px-2 text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      toggleVariantRestriction(
                                        product.id,
                                        variant.id
                                      )
                                    }
                                    className="size-4 shrink-0"
                                  />
                                  <span className="min-w-0 flex-1 truncate">
                                    {variant.name}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}

                      {isSelected && (product.modifierGroups ?? []).length > 0 ? (
                        <div className="ml-7 grid gap-2 border-t border-border/60 pt-2">
                          <div className="grid gap-1">
                            <span className="text-xs font-medium">
                              Deal modifier overrides
                            </span>
                            <span className="text-xs leading-5 text-muted-foreground">
                              Leave blank to use product default. Set to 2 for a
                              2-topping deal. Half toppings may count as 0.5
                              based on business pricing settings.
                            </span>
                          </div>
                          <div className="grid gap-2">
                            {(product.modifierGroups ?? []).map((group) => (
                              <label
                                key={group.id}
                                className="grid gap-1 rounded-md border bg-background p-2 text-sm"
                              >
                                <span className="font-medium">{group.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Product default:{" "}
                                  {group.includedQuantity ?? 0} included
                                  {!group.isAssignmentEnabled || !group.isEnabled
                                    ? " - disabled"
                                    : ""}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  name={`${modifierOverrideInputNamePrefix}::${product.id}::${group.id}`}
                                  value={
                                    selectedModifierGroupOverrides[product.id]?.[
                                      group.id
                                    ] ?? ""
                                  }
                                  onChange={(event) =>
                                    onModifierGroupOverrideChange(
                                      product.id,
                                      group.id,
                                      event.target.value
                                    )
                                  }
                                  placeholder="Use product default"
                                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ),
        }
      })
  )

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{title}</legend>
      {selectedIds.map((productId) => (
        <input
          key={productId}
          type="hidden"
          name={inputName}
          value={productId}
        />
      ))}
      {Object.entries(selectedVariantRestrictions).flatMap(
        ([productId, variantIds]) =>
          selectedIds.includes(productId)
            ? variantIds.map((variantId) => (
                <input
                  key={`${productId}-${variantId}`}
                  type="hidden"
                  name={`${variantInputNamePrefix}-${productId}`}
                  value={variantId}
                />
              ))
            : []
      )}
      <div className="grid gap-3 rounded-md border bg-background p-3">
        {helperText ? (
          <p className="text-xs leading-5 text-muted-foreground">{helperText}</p>
        ) : null}
        <p className="text-xs leading-5 text-muted-foreground">
          {formatSelectedProductSummary({ products, selectedIds })}
        </p>

        {products.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No business products found. Create products first, then return to
            this deal component.
          </p>
        ) : (
          <>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <ThemedButton
                  key={category.id}
                  type="button"
                  variant={
                    selectedCategoryId === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </ThemedButton>
              ))}
            </div>

            {visibleProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No products found in this category. Choose another category or
                create products first, then return to this deal component.
              </p>
            ) : (
              <ThemedAccordion
                key={selectedCategoryId}
                items={accordionItems}
                defaultOpenIds={[]}
                compact
                keepMounted
              />
            )}
          </>
        )}
      </div>
    </fieldset>
  )
}

function MixMatchEditor({
  products,
  initialMixMatch,
}: {
  products: SpecialAdminFormData["products"]
  initialMixMatch: MixMatchDraft
}) {
  const [productIds, setProductIds] = useState(initialMixMatch.productIds)
  const [productVariantRestrictions, setProductVariantRestrictions] = useState(
    initialMixMatch.productVariantRestrictions
  )
  const [modifierGroupOverrides, setModifierGroupOverrides] = useState(
    initialMixMatch.modifierGroupOverrides
  )

  function updateProductIds(nextProductIds: string[]) {
    setProductIds(nextProductIds)
    setProductVariantRestrictions((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([productId]) =>
          nextProductIds.includes(productId)
        )
      )
    )
    setModifierGroupOverrides((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([productId]) =>
          nextProductIds.includes(productId)
        )
      )
    )
  }

  function updateVariantRestrictions(
    productId: string,
    allowedVariantOptionIds: string[]
  ) {
    setProductVariantRestrictions((current) => {
      const nextRestrictions = { ...current }

      if (allowedVariantOptionIds.length === 0) {
        delete nextRestrictions[productId]
      } else {
        nextRestrictions[productId] = allowedVariantOptionIds
      }

      return nextRestrictions
    })
  }

  function updateModifierGroupOverride(
    productId: string,
    modifierGroupId: string,
    includedSelectionCount: string
  ) {
    setModifierGroupOverrides((current) => {
      const productOverrides = { ...(current[productId] ?? {}) }

      if (includedSelectionCount.trim().length === 0) {
        delete productOverrides[modifierGroupId]
      } else {
        productOverrides[modifierGroupId] = includedSelectionCount
      }

      const nextOverrides = { ...current }

      if (Object.keys(productOverrides).length === 0) {
        delete nextOverrides[productId]
      } else {
        nextOverrides[productId] = productOverrides
      }

      return nextOverrides
    })
  }

  return (
    <ThemedAccordion
      items={[
        {
          id: "mix-and-match",
          title: "Mix & Match",
          subtitle:
            "Fixed unit price rule, exact product pool, variants, and modifier overrides.",
          meta: `${productIds.length} pool ${
            productIds.length === 1 ? "product" : "products"
          }`,
          content: (
            <div className="grid gap-4">
              <p className="text-xs leading-5 text-muted-foreground">
                Customers choose a minimum number of eligible items from a
                product pool. Each selected mix item uses the fixed unit price.
              </p>

              <div className="grid gap-3 sm:grid-cols-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Min qty required</span>
                  <input
                    name="mixMinQuantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                    defaultValue={initialMixMatch.minQuantity}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Max qty optional</span>
                  <input
                    name="mixMaxQuantity"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={initialMixMatch.maxQuantity ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Unit price</span>
                  <input
                    name="mixUnitPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue={initialMixMatch.unitPrice || ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Allow extras</span>
                  <select
                    name="mixAllowExtraItems"
                    defaultValue={String(initialMixMatch.allowExtraItems)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </label>
              </div>

              <ComponentProductPicker
                title="Mix pool products"
                helperText="Select exact products from this business. Every selected mix item uses the fixed unit price. No selected variant rows means all enabled variants are allowed. Free attached items, such as plus a free 2-liter, are not supported here yet."
                inputName="mixProductIds"
                variantInputNamePrefix="mixProductVariantOptionIds"
                modifierOverrideInputNamePrefix="mixModifierIncludedCount"
                products={products}
                selectedIds={productIds}
                selectedVariantRestrictions={productVariantRestrictions}
                selectedModifierGroupOverrides={modifierGroupOverrides}
                onSelectedIdsChange={updateProductIds}
                onVariantRestrictionsChange={updateVariantRestrictions}
                onModifierGroupOverrideChange={updateModifierGroupOverride}
              />
            </div>
          ),
        },
      ]}
      defaultOpenIds={[]}
      keepMounted
    />
  )
}

function DealComponentsEditor({
  products,
  initialComponents,
}: {
  products: SpecialAdminFormData["products"]
  initialComponents: ComponentDraft[]
}) {
  const [components, setComponents] = useState(initialComponents)
  const [openComponentIds, setOpenComponentIds] = useState<string[]>([])

  function addComponent() {
    const key = `component-${Date.now()}`

    setComponents((current) => [
      ...current,
      {
        key,
        label: "",
        description: "",
        sortOrder: current.length + 1,
        requiredQuantity: 1,
        minQuantity: 1,
        maxQuantity: 1,
        pricingMode: "included",
        fixedPrice: "",
        productIds: [],
        productVariantRestrictions: {},
        modifierGroupOverrides: {},
      },
    ])
  }

  function removeComponent(key: string) {
    setOpenComponentIds((current) => current.filter((openId) => openId !== key))
    setComponents((current) =>
      current
        .filter((component) => component.key !== key)
        .map((component, index) => ({
          ...component,
          sortOrder: index + 1,
        }))
    )
  }

  function updateComponentProductIds(key: string, productIds: string[]) {
    setComponents((current) =>
      current.map((component) =>
        component.key === key
          ? {
              ...component,
              productIds,
              productVariantRestrictions: Object.fromEntries(
                Object.entries(component.productVariantRestrictions).filter(
                  ([productId]) => productIds.includes(productId)
                )
              ),
              modifierGroupOverrides: Object.fromEntries(
                Object.entries(component.modifierGroupOverrides).filter(
                  ([productId]) => productIds.includes(productId)
                )
              ),
            }
          : component
      )
    )
  }

  function updateComponentPricing({
    key,
    pricingMode,
    fixedPrice,
  }: {
    key: string
    pricingMode?: AdminComponentPricingMode
    fixedPrice?: string
  }) {
    setComponents((current) =>
      current.map((component) =>
        component.key === key
          ? {
              ...component,
              pricingMode: pricingMode ?? component.pricingMode,
              fixedPrice:
                pricingMode === "included"
                  ? ""
                  : fixedPrice !== undefined
                    ? fixedPrice
                    : component.fixedPrice,
            }
          : component
      )
    )
  }

  function updateComponentModifierGroupOverride({
    key,
    productId,
    modifierGroupId,
    includedSelectionCount,
  }: {
    key: string
    productId: string
    modifierGroupId: string
    includedSelectionCount: string
  }) {
    setComponents((current) =>
      current.map((component) => {
        if (component.key !== key) return component

        const productOverrides = {
          ...(component.modifierGroupOverrides[productId] ?? {}),
        }

        if (includedSelectionCount.trim().length === 0) {
          delete productOverrides[modifierGroupId]
        } else {
          productOverrides[modifierGroupId] = includedSelectionCount
        }

        const nextOverrides = { ...component.modifierGroupOverrides }

        if (Object.keys(productOverrides).length === 0) {
          delete nextOverrides[productId]
        } else {
          nextOverrides[productId] = productOverrides
        }

        return {
          ...component,
          modifierGroupOverrides: nextOverrides,
        }
      })
    )
  }

  function updateComponentVariantRestrictions({
    key,
    productId,
    allowedVariantOptionIds,
  }: {
    key: string
    productId: string
    allowedVariantOptionIds: string[]
  }) {
    setComponents((current) =>
      current.map((component) => {
        if (component.key !== key) return component

        const nextRestrictions = { ...component.productVariantRestrictions }

        if (allowedVariantOptionIds.length === 0) {
          delete nextRestrictions[productId]
        } else {
          nextRestrictions[productId] = allowedVariantOptionIds
        }

        return {
          ...component,
          productVariantRestrictions: nextRestrictions,
        }
      })
    )
  }

  const componentAccordionItems: ThemedAccordionItem[] = components.map(
    (component, index) => ({
      id: component.key,
      title: `Component ${index + 1}${
        component.label ? `: ${component.label}` : ""
      }`,
      subtitle: formatSelectedProductSummary({
        products,
        selectedIds: component.productIds,
      }),
      meta: `${component.productIds.length} ${
        component.productIds.length === 1 ? "product" : "products"
      }`,
      content: (
        <div className="grid gap-3">
          <div className="flex justify-end">
            <ThemedButton
              type="button"
              variant="destructive"
              size="sm"
              aria-label={`Remove component ${index + 1}`}
              onClick={() => removeComponent(component.key)}
            >
              <Trash2 aria-hidden="true" />
              Remove
            </ThemedButton>
          </div>

          <input
            type="hidden"
            name={`componentSortOrder-${index}`}
            value={index + 1}
          />

          <label className="grid gap-2">
            <span className="text-sm font-medium">Label</span>
            <input
              name={`componentLabel-${index}`}
              required
              defaultValue={component.label}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Description optional</span>
            <textarea
              name={`componentDescription-${index}`}
              rows={2}
              defaultValue={component.description}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Required quantity</span>
              <input
                name={`componentRequiredQuantity-${index}`}
                type="number"
                min="0"
                step="1"
                required
                defaultValue={component.requiredQuantity}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Min quantity</span>
              <input
                name={`componentMinQuantity-${index}`}
                type="number"
                min="0"
                step="1"
                required
                defaultValue={component.minQuantity}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Max quantity</span>
              <input
                name={`componentMaxQuantity-${index}`}
                type="number"
                min="0"
                step="1"
                required
                defaultValue={component.maxQuantity}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Pricing mode</span>
              <select
                name={`componentPricingMode-${index}`}
                value={component.pricingMode}
                onChange={(event) =>
                  updateComponentPricing({
                    key: component.key,
                    pricingMode: parseAdminComponentPricingMode(
                      event.target.value
                    ),
                  })
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="included">Included/free</option>
                <option value="fixed_price">Fixed component price</option>
              </select>
              <span className="text-xs leading-5 text-muted-foreground">
                {component.pricingMode === "fixed_price"
                  ? "The component base item uses this fixed price instead of the product's normal base price."
                  : "The component base item adds $0 to the deal total. Modifier or variant extras may still be charged later when runtime support is wired."}
              </span>
            </label>

            {component.pricingMode === "fixed_price" ? (
              <label className="grid gap-2">
                <span className="text-sm font-medium">Fixed price</span>
                <input
                  name={`componentFixedPrice-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={component.fixedPrice}
                  onChange={(event) =>
                    updateComponentPricing({
                      key: component.key,
                      fixedPrice: event.target.value,
                    })
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>
            ) : (
              <input
                type="hidden"
                name={`componentFixedPrice-${index}`}
                value=""
              />
            )}
          </div>

          <ComponentProductPicker
            inputName={`componentProductIds-${index}`}
            variantInputNamePrefix={`componentProductVariantOptionIds-${index}`}
            modifierOverrideInputNamePrefix={`componentModifierIncludedCount-${index}`}
            products={products}
            selectedIds={component.productIds}
            selectedVariantRestrictions={component.productVariantRestrictions}
            selectedModifierGroupOverrides={component.modifierGroupOverrides}
            onSelectedIdsChange={(productIds) =>
              updateComponentProductIds(component.key, productIds)
            }
            onVariantRestrictionsChange={(productId, allowedVariantOptionIds) =>
              updateComponentVariantRestrictions({
                key: component.key,
                productId,
                allowedVariantOptionIds,
              })
            }
            onModifierGroupOverrideChange={(
              productId,
              modifierGroupId,
              includedSelectionCount
            ) =>
              updateComponentModifierGroupOverride({
                key: component.key,
                productId,
                modifierGroupId,
                includedSelectionCount,
              })
            }
          />
        </div>
      ),
    })
  )

  return (
    <fieldset className="grid gap-3">
      <input type="hidden" name="componentCount" value={components.length} />
      <ThemedAccordion
        items={[
          {
            id: "deal-components",
            title: "Deal components",
            subtitle:
              "Required choice areas the customer configures when building the deal.",
            meta: `${components.length} ${
              components.length === 1 ? "component" : "components"
            }`,
            content: (
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Each component is a required choice area the customer will
                    configure when building the deal.
                  </p>
                  <ThemedButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addComponent}
                  >
                    <Plus aria-hidden="true" />
                    Add component
                  </ThemedButton>
                </div>
                <ThemedAccordion
                  items={componentAccordionItems}
                  openIds={openComponentIds}
                  onOpenIdsChange={setOpenComponentIds}
                  keepMounted
                />
              </div>
            ),
          },
        ]}
        defaultOpenIds={[]}
        keepMounted
      />
    </fieldset>
  )
}

export function SpecialFormFields({
  data,
  businessSlug,
}: {
  data: SpecialAdminFormData
  businessSlug: string
}) {
  const special = data.special
  const [specialType, setSpecialType] = useState(
    special?.specialType ?? "line_discount"
  )
  const isOrderableDeal = specialType === "orderable_deal"
  const isMixAndMatch = specialType === "mix_and_match_fixed_unit_price"
  const hidesPassiveFields = isOrderableDeal || isMixAndMatch
  const availabilityFields = (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Start date/time</span>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={formatDateTimeInput(special?.startsAt)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">End date/time</span>
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={formatDateTimeInput(special?.endsAt)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>
      </div>

      <AvailabilityFields special={special} />
    </>
  )
  const specialDetailsFields = (
    <>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            required
            defaultValue={special?.name ?? ""}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Status</span>
          <select
            name="isEnabled"
            defaultValue={String(special?.isEnabled ?? false)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Internal description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={special?.description ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Customer description</span>
        <textarea
          name="customerDescription"
          rows={3}
          defaultValue={special?.customerDescription ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Special type</span>
          <select
            name="specialType"
            value={specialType}
            onChange={(event) =>
              setSpecialType(event.target.value as SpecialType)
            }
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="line_discount">Line discount</option>
            <option value="fixed_price_line">Fixed price line</option>
            <option value="cart_discount">Cart discount</option>
            <option value="orderable_deal">Orderable deal</option>
            <option value="mix_and_match_fixed_unit_price">Mix & Match</option>
          </select>
          <span className="text-xs leading-5 text-muted-foreground">
            Passive discounts apply automatically to normal cart items. Orderable
            deals use fixed components. Mix & Match uses one fixed-unit-price
            product pool.
          </span>
        </label>

        {!hidesPassiveFields ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium">Discount type</span>
            <select
              name="discountType"
              defaultValue={special?.discountType ?? "percentage"}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed_amount">Fixed amount</option>
              <option value="fixed_price">Fixed price</option>
            </select>
          </label>
        ) : null}

        {!isMixAndMatch ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              {isOrderableDeal ? "Deal base price" : "Discount value"}
            </span>
            <input
              name="discountValue"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={special?.discountValue ?? ""}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
            {isOrderableDeal ? (
              <span className="text-xs leading-5 text-muted-foreground">
                Customers build this deal by choosing products for each
                component. The deal price is the base price plus any allowed
                child extras.
              </span>
            ) : null}
          </label>
        ) : null}
      </div>
    </>
  )

  return (
    <>
      <input type="hidden" name="businessSlug" value={businessSlug} />
      {special ? (
        <input type="hidden" name="specialId" value={special.id} />
      ) : null}
      {hidesPassiveFields ? (
        <input type="hidden" name="discountType" value="fixed_price" />
      ) : null}

      <div className="grid gap-4">
        {hidesPassiveFields ? (
          <ThemedAccordion
            items={[
              {
                id: "deal-details",
                title: isMixAndMatch ? "Special details" : "Deal details",
                subtitle: isMixAndMatch
                  ? "Name, customer copy, status, and type."
                  : "Name, customer copy, status, type, and base price.",
                content: <div className="grid gap-4">{specialDetailsFields}</div>,
              },
            ]}
            defaultOpenIds={[]}
            keepMounted
          />
        ) : (
          specialDetailsFields
        )}

        {!hidesPassiveFields ? (
          <>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Minimum order amount</span>
              <input
                name="minOrderAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={special?.minOrderAmount ?? ""}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </label>

            <EligibilityCheckboxes
              title="Eligible products"
              name="productIds"
              options={data.products}
              selectedIds={special?.productIds ?? []}
            />

            <EligibilityCheckboxes
              title="Eligible categories / menu groups"
              name="menuGroupIds"
              options={data.menuGroups}
              selectedIds={special?.menuGroupIds ?? []}
            />
          </>
        ) : isOrderableDeal ? (
          <DealComponentsEditor
            products={data.products}
            initialComponents={buildInitialComponents(special)}
          />
        ) : (
          <MixMatchEditor
            products={data.products}
            initialMixMatch={buildInitialMixMatch(special)}
          />
        )}

        {hidesPassiveFields ? (
          <ThemedAccordion
            items={[
              {
                id: "deal-availability",
                title: "Deal availability",
                subtitle: "Date range and recurring day/time windows.",
                content: <div className="grid gap-4">{availabilityFields}</div>,
              },
            ]}
            defaultOpenIds={[]}
            keepMounted
          />
        ) : (
          availabilityFields
        )}
      </div>
    </>
  )
}
