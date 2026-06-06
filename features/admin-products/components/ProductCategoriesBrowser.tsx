"use client"

import { useRef, useState } from "react"
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
import { saveProductCategory } from "@/features/admin-products/actions/save-product-category"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type { ProductCategory } from "@/features/admin-products/queries/get-product-categories"
import { getProductAdminHref } from "@/features/admin-products/utils/product-admin-routes"

type CategoryPanelState =
  | {
      mode: "create"
      category: null
    }
  | {
      mode: "edit"
      category: ProductCategory
    }

type ProductCategoriesBrowserProps = {
  businessName: string
  categories: ProductCategory[]
  businessSlug?: string
  writesEnabled?: boolean
}

function getNextSortOrder(categories: ProductCategory[]) {
  if (categories.length === 0) return 1

  return Math.max(...categories.map((category) => category.sort_order)) + 1
}

function CategoryFormPanel({
  open,
  onOpenChange,
  panelState,
  nextSortOrder,
  businessSlug,
  writesEnabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  panelState: CategoryPanelState | null
  nextSortOrder: number
  businessSlug?: string
  writesEnabled: boolean
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnabled, setIsEnabled] = useState(
    panelState?.category?.is_enabled ?? true
  )

  if (!panelState) return null

  const category = panelState.category
  const isCreateMode = panelState.mode === "create"
  const title = isCreateMode ? "New Category" : "Edit Category"
  const description = isCreateMode
    ? "Create a top-level product category."
    : "Update this top-level product category."
  const submitLabel = isCreateMode ? "Create category" : "Save category"

  async function handleSubmit(formData: FormData) {
    if (isSubmittingRef.current) return

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      await saveProductCategory(formData)
      formRef.current?.reset()
      onOpenChange(false)
      router.refresh()
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
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
          key={`${panelState.mode}-${category?.id ?? "new"}`}
          ref={formRef}
          action={writesEnabled ? handleSubmit : undefined}
          className="flex min-h-0 flex-1 flex-col"
        >
          {businessSlug ? (
            <input type="hidden" name="businessSlug" value={businessSlug} />
          ) : null}
          <div className={`${PRODUCT_ADMIN_PANEL_BODY_CLASS} pb-4`}>
            {category ? (
              <>
                <input type="hidden" name="categoryId" value={category.id} />
                <input
                  type="hidden"
                  name="isEnabled"
                  value={String(isEnabled)}
                />
              </>
            ) : null}

            <div className="grid gap-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium">Name</span>
                  <input
                    name="name"
                    required
                    defaultValue={category?.name ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                {!isCreateMode && category ? (
                  <ThemedButton
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`${isEnabled ? "Disable" : "Enable"} product category ${category.name}`}
                    className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
                    onClick={() => setIsEnabled((current) => !current)}
                  >
                    {isEnabled ? (
                      <ThumbsUp aria-hidden="true" />
                    ) : (
                      <ThumbsDown aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {isEnabled ? "Disable" : "Enable"} product category
                    </span>
                  </ThemedButton>
                ) : null}
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={category?.description ?? ""}
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
                      category?.sort_order ?? nextSortOrder
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
              disabled={!writesEnabled || isSubmitting}
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

export function ProductCategoriesBrowser({
  businessName,
  categories,
  businessSlug,
  writesEnabled = true,
}: ProductCategoriesBrowserProps) {
  const router = useRouter()
  const [panelState, setPanelState] = useState<CategoryPanelState | null>(null)
  const nextSortOrder = getNextSortOrder(categories)

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <ThemedPageHeader
          title="Product Categories"
          description={`Top-level menu categories for ${businessName}.`}
          className="shrink-0 border-b pb-3"
        />

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {categories.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No product categories yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a category before adding subcategories or products.
              </p>
            </ThemedCard>
          ) : (
            categories.map((category) => (
              <ThemedCard
                key={category.id}
                role="button"
                tabIndex={0}
                aria-label={`Edit product category ${category.name}`}
                onClick={() => setPanelState({ mode: "edit", category })}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault()
                    setPanelState({ mode: "edit", category })
                  }
                }}
                className={
                  category.is_enabled
                    ? "cursor-pointer gap-0 overflow-hidden py-0"
                    : "cursor-pointer gap-0 overflow-hidden bg-muted/30 py-0 opacity-75"
                }
              >
                <CompactRecordRow
                  title={category.name}
                  statusIcon={
                    <CompactRecordStatusIcon enabled={category.is_enabled} />
                  }
                  description={category.description}
                  rightAction={
                    <ThemedButton
                      type="button"
                      variant="outline"
                      className="h-8 bg-background px-3 text-xs text-foreground hover:bg-muted"
                      onClick={(event) => {
                        event.stopPropagation()
                        router.push(
                          getProductAdminHref(
                            `subcategories?categoryId=${category.id}`,
                            businessSlug
                          )
                        )
                      }}
                    >
                      Manage Subcategories
                    </ThemedButton>
                  }
                />
              </ThemedCard>
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end gap-2">
            <AdminBackButton
              fallbackHref={getProductAdminHref("", businessSlug)}
              label="Back to product management"
            />
            <ThemedButton
              type="button"
              size="icon"
              aria-label="New Category"
              className="size-10 rounded-md p-0 shadow-sm"
              disabled={!writesEnabled}
              onClick={() => setPanelState({ mode: "create", category: null })}
            >
              <Plus aria-hidden="true" />
              <span className="sr-only">New Category</span>
            </ThemedButton>
          </div>
        </div>
      </div>

      <CategoryFormPanel
        key={`${panelState?.mode ?? "closed"}-${panelState?.category?.id ?? "new"}`}
        open={panelState !== null}
        onOpenChange={(open) => {
          if (!open) setPanelState(null)
        }}
        panelState={panelState}
        nextSortOrder={nextSortOrder}
        businessSlug={businessSlug}
        writesEnabled={writesEnabled}
      />
    </main>
  )
}
