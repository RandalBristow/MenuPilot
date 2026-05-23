"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import { saveProductSubcategory } from "@/features/admin-products/actions/save-product-subcategory"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type {
  ProductSubcategory,
  ProductSubcategoryParent,
} from "@/features/admin-products/queries/get-product-subcategories"

type SubcategoryPanelState =
  | {
      mode: "create"
      subcategory: null
    }
  | {
      mode: "edit"
      subcategory: ProductSubcategory
    }

type ProductSubcategoriesBrowserProps = {
  businessName: string
  categories: ProductSubcategoryParent[]
  subcategories: ProductSubcategory[]
  initialCategoryId?: string
}

function getNextSortOrder(subcategories: ProductSubcategory[]) {
  if (subcategories.length === 0) return 1

  return (
    Math.max(...subcategories.map((subcategory) => subcategory.sort_order)) + 1
  )
}

function SubcategoryFormPanel({
  open,
  onOpenChange,
  panelState,
  categories,
  selectedCategoryId,
  nextSortOrder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  panelState: SubcategoryPanelState | null
  categories: ProductSubcategoryParent[]
  selectedCategoryId: string
  nextSortOrder: number
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isEnabled, setIsEnabled] = useState(
    panelState?.subcategory?.is_enabled ?? true
  )

  if (!panelState) return null

  const subcategory = panelState.subcategory
  const isCreateMode = panelState.mode === "create"
  const title = isCreateMode ? "New Subcategory" : "Edit Subcategory"
  const description = isCreateMode
    ? "Create a product subcategory inside a parent category."
    : "Update this product subcategory."
  const submitLabel = isCreateMode ? "Create subcategory" : "Save subcategory"

  async function handleSubmit(formData: FormData) {
    await saveProductSubcategory(formData)
    formRef.current?.reset()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <ThemedSheet open={open} onOpenChange={onOpenChange}>
      <ThemedSheetContent
        side="bottom"
        showCloseButton={false}
        className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
      >
        <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
          <ThemedSheetTitle>{title}</ThemedSheetTitle>
          <ThemedSheetDescription>{description}</ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          key={`${panelState.mode}-${subcategory?.id ?? "new"}`}
          ref={formRef}
          action={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={`${PRODUCT_ADMIN_PANEL_BODY_CLASS} pb-4`}>
            {subcategory ? (
              <>
                <input
                  type="hidden"
                  name="subcategoryId"
                  value={subcategory.id}
                />
                <input
                  type="hidden"
                  name="isEnabled"
                  value={String(isEnabled)}
                />
              </>
            ) : null}

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Parent category</span>
                <select
                  name="parentCategoryId"
                  required
                  defaultValue={
                    subcategory?.parent_group_id ?? selectedCategoryId
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium">Name</span>
                  <input
                    name="name"
                    required
                    defaultValue={subcategory?.name ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                {!isCreateMode && subcategory ? (
                  <ThemedButton
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`${isEnabled ? "Disable" : "Enable"} product subcategory ${subcategory.name}`}
                    className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
                    onClick={() => setIsEnabled((current) => !current)}
                  >
                    {isEnabled ? (
                      <ThumbsUp aria-hidden="true" />
                    ) : (
                      <ThumbsDown aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {isEnabled ? "Disable" : "Enable"} product subcategory
                    </span>
                  </ThemedButton>
                ) : null}
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={subcategory?.description ?? ""}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </label>

              <div
                className={isCreateMode ? "grid grid-cols-2 gap-3" : "grid gap-3"}
              >
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Sort order</span>
                  <input
                    name="sortOrder"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={String(
                      subcategory?.sort_order ?? nextSortOrder
                    )}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                {isCreateMode ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Status</span>
                    <select
                      name="isEnabled"
                      defaultValue="true"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </label>
                ) : null}
              </div>
            </div>
          </div>

          <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Close</span>
            </ThemedButton>
            <ThemedButton
              type="submit"
              size="icon"
              aria-label={submitLabel}
              className="size-10"
            >
              <Check aria-hidden="true" />
              <span className="sr-only">{submitLabel}</span>
            </ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}

export function ProductSubcategoriesBrowser({
  businessName,
  categories,
  subcategories,
  initialCategoryId,
}: ProductSubcategoriesBrowserProps) {
  const [selectedCategoryId] = useState<string>(
    categories.some((category) => category.id === initialCategoryId)
      ? (initialCategoryId ?? "")
      : (categories[0]?.id ?? "")
  )
  const [panelState, setPanelState] = useState<SubcategoryPanelState | null>(
    null
  )
  const visibleSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.parent_group_id === selectedCategoryId
      ),
    [selectedCategoryId, subcategories]
  )
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null
  const nextSortOrder = getNextSortOrder(visibleSubcategories)

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title={
              selectedCategory
                ? `${selectedCategory.name} Subcategories`
                : "Product Subcategories"
            }
            description={
              selectedCategory
                ? `Subcategories inside ${selectedCategory.name}.`
                : `Child menu categories for ${businessName}.`
            }
          />
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {categories.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No parent categories yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a product category before adding subcategories.
              </p>
            </ThemedCard>
          ) : visibleSubcategories.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No subcategories yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a subcategory under the selected category.
              </p>
            </ThemedCard>
          ) : (
            visibleSubcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                type="button"
                aria-label={`Edit product subcategory ${subcategory.name}`}
                onClick={() => setPanelState({ mode: "edit", subcategory })}
                className={
                  subcategory.is_enabled
                    ? "block w-full text-left"
                    : "block w-full text-left opacity-75"
                }
              >
                <ThemedCard
                  className={
                    subcategory.is_enabled
                      ? "overflow-hidden py-0"
                      : "overflow-hidden bg-muted/30 py-0"
                  }
                >
                  <CompactRecordRow
                    title={subcategory.name}
                    statusIcon={
                      <CompactRecordStatusIcon
                        enabled={subcategory.is_enabled}
                      />
                    }
                    description={subcategory.description}
                    metadata={<span>Sort {subcategory.sort_order}</span>}
                  />
                </ThemedCard>
              </button>
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end gap-2">
            <AdminBackButton
              fallbackHref="/admin/products/categories"
              label="Back to product categories"
            />
            <ThemedButton
              type="button"
              size="icon"
              aria-label="New Subcategory"
              className="size-10 rounded-md p-0 shadow-sm sm:size-8"
              disabled={!selectedCategoryId}
              onClick={() =>
                setPanelState({ mode: "create", subcategory: null })
              }
            >
              <Plus aria-hidden="true" />
              <span className="sr-only">New Subcategory</span>
            </ThemedButton>
          </div>
        </div>
      </div>

      <SubcategoryFormPanel
        key={`${panelState?.mode ?? "closed"}-${panelState?.subcategory?.id ?? "new"}`}
        open={panelState !== null}
        onOpenChange={(open) => {
          if (!open) setPanelState(null)
        }}
        panelState={panelState}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        nextSortOrder={nextSortOrder}
      />
    </main>
  )
}
