"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, Pencil, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { CompactRecordActionButton } from "@/components/themed/CompactRecordActionButton"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import {
  ThemedSheet,
  ThemedSheetContent,
} from "@/components/themed/ThemedSheet"
import { updateProduct } from "@/features/admin-products/actions/update-product"
import {
  ProductPanelFooter,
  ProductPanelHeader,
  ProductUpdateHiddenFields,
  formatMoney,
  getDefaultVariantIndex,
} from "@/features/admin-products/components/ProductAdminFormParts"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type { ProductFormVariant } from "@/features/admin-products/components/ProductVariantFields"
import type { ExistingProduct } from "@/features/admin-products/components/ProductForm"
import type { ProductManagementData } from "@/features/admin-products/queries/get-product-management-data"

type ProductVariantsClientProps = {
  data: ProductManagementData
}

type ActiveVariant =
  | {
      mode: "create"
    }
  | {
      mode: "edit"
      index: number
      variant: ProductFormVariant
    }

function getVariantDescription(variant: ProductFormVariant) {
  const tags = [
    formatMoney(variant.base_price),
    `sort ${variant.sort_order}`,
    variant.is_default ? "default" : null,
  ].filter(Boolean)

  return tags.join(" - ")
}

function VariantHiddenInputs({
  variants,
  defaultVariantIndex,
}: {
  variants: ProductFormVariant[]
  defaultVariantIndex: number | null
}) {
  return (
    <>
      {variants.map((variant, index) => (
        <div key={variant.id ?? index} className="hidden">
          <input type="hidden" name="variantIds" value={variant.id ?? ""} />
          <input type="hidden" name="variantNames" value={variant.name} />
          <input
            type="hidden"
            name="variantBasePrices"
            value={String(variant.base_price)}
          />
          <input
            type="hidden"
            name="variantSortOrders"
            value={String(variant.sort_order)}
          />
          <input
            type="hidden"
            name="variantIsEnabled"
            value={String(variant.is_enabled)}
          />
        </div>
      ))}
      {defaultVariantIndex !== null ? (
        <input
          type="hidden"
          name="defaultVariantIndex"
          value={String(defaultVariantIndex)}
        />
      ) : null}
    </>
  )
}

function VariantToggleForm({
  product,
  index,
  variant,
}: {
  product: ExistingProduct
  index: number
  variant: ProductFormVariant
}) {
  const nextVariants = product.variants.map((item, itemIndex) =>
    itemIndex === index ? { ...item, is_enabled: !variant.is_enabled } : item
  )

  return (
    <form action={updateProduct}>
      <ProductUpdateHiddenFields
        product={product}
        redirectTo={`/admin/products/variants?productId=${product.id}`}
        includeVariants={false}
      />
      <VariantHiddenInputs
        variants={nextVariants}
        defaultVariantIndex={getDefaultVariantIndex(product)}
      />
      <CompactRecordActionButton
        type="submit"
        aria-label={
          variant.is_enabled
            ? `Disable variant ${variant.name}`
            : `Enable variant ${variant.name}`
        }
      >
        {variant.is_enabled ? (
          <ThumbsUp aria-hidden="true" />
        ) : (
          <ThumbsDown aria-hidden="true" />
        )}
      </CompactRecordActionButton>
    </form>
  )
}

function VariantFormPanel({
  product,
  activeVariant,
  onClose,
}: {
  product: ExistingProduct
  activeVariant: ActiveVariant | null
  onClose: () => void
}) {
  const isCreateMode = activeVariant?.mode === "create"
  const variant =
    activeVariant?.mode === "edit" ? activeVariant.variant : null
  const variantIndex =
    activeVariant?.mode === "edit"
      ? activeVariant.index
      : product.variants.length
  const existingDefaultIndex = getDefaultVariantIndex(product)
  const [makeDefault, setMakeDefault] = useState(
    isCreateMode ? product.variants.length === 0 : (variant?.is_default ?? false)
  )
  const defaultVariantIndex =
    product.variants.length === 0 && isCreateMode
      ? 0
      : makeDefault
        ? variantIndex
        : existingDefaultIndex

  if (!activeVariant) return null

  function renderVariantFields(fieldVariant: ProductFormVariant | null) {
    return (
      <>
        <input type="hidden" name="variantIds" value={fieldVariant?.id ?? ""} />

        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Variant name</span>
            <input
              name="variantNames"
              required
              defaultValue={fieldVariant?.name ?? ""}
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
                defaultValue={fieldVariant?.base_price ?? 0}
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
                defaultValue={fieldVariant?.sort_order ?? product.variants.length}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Status</span>
            <select
              name="variantIsEnabled"
              defaultValue={fieldVariant?.is_enabled === false ? "false" : "true"}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={makeDefault}
              disabled={product.variants.length === 0 && isCreateMode}
              onChange={(event) => setMakeDefault(event.target.checked)}
            />
            Default variant
          </label>
        </div>
      </>
    )
  }

  return (
    <ThemedSheet open onOpenChange={(open) => !open && onClose()}>
      <ThemedSheetContent
        side="bottom"
        showCloseButton={false}
        className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
      >
        <ProductPanelHeader
          title={isCreateMode ? "Add Variant" : "Edit Variant"}
          description={`Manage a variant for ${product.name}.`}
          onClose={onClose}
        />
        <form action={updateProduct} className="flex min-h-0 flex-1 flex-col">
          <div className={PRODUCT_ADMIN_PANEL_BODY_CLASS}>
            <ProductUpdateHiddenFields
              product={product}
              redirectTo={`/admin/products/variants?productId=${product.id}`}
              includeVariants={false}
            />
            {product.variants.map((item, index) =>
              activeVariant.mode === "edit" && index === activeVariant.index ? (
                <div key={item.id ?? index}>{renderVariantFields(item)}</div>
              ) : (
                <VariantHiddenInputs
                  key={item.id ?? index}
                  variants={[item]}
                  defaultVariantIndex={null}
                />
              )
            )}
            {activeVariant.mode === "create" ? renderVariantFields(null) : null}
            <input
              type="hidden"
              name="defaultVariantIndex"
              value={String(defaultVariantIndex)}
            />
          </div>

          <ProductPanelFooter
            closeControl={
              <ThemedButton
                type="button"
                variant="outline"
                size="icon"
                aria-label="Close"
                className="size-10 bg-background text-foreground hover:bg-muted"
                onClick={onClose}
              >
                <X aria-hidden="true" />
                <span className="sr-only">Close</span>
              </ThemedButton>
            }
            submitLabel={isCreateMode ? "Create variant" : "Save variant"}
          />
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}

export function ProductVariantsClient({ data }: ProductVariantsClientProps) {
  const router = useRouter()
  const { products, product, businessName } = data
  const [activeVariant, setActiveVariant] = useState<ActiveVariant | null>(null)
  const [viewVariant, setViewVariant] = useState<ProductFormVariant | null>(null)

  function handleProductChange(productId: string) {
    router.push(`/admin/products/variants?productId=${productId}`)
  }

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col">
        <div className="shrink-0 space-y-3 border-b pb-1.5">
          <div className="space-y-2">
            <ThemedHeading>Product Variants</ThemedHeading>
            <p className="text-sm text-muted-foreground">
              Manage product variant rows for {businessName}.
            </p>
          </div>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Product</span>
            <select
              value={product?.id ?? ""}
              onChange={(event) => handleProductChange(event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-20 pt-3">
          {!product ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No products yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a product before managing variants.
              </p>
            </ThemedCard>
          ) : product.variants.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No variants yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The product base price is currently used.
              </p>
            </ThemedCard>
          ) : (
            product.variants.map((variant, index) => (
              <ThemedCard
                key={variant.id ?? index}
                className={
                  variant.is_enabled
                    ? "overflow-hidden py-0"
                    : "overflow-hidden bg-muted/30 py-0 opacity-75"
                }
              >
                <CompactRecordRow
                  title={variant.name}
                  statusIcon={
                    <CompactRecordStatusIcon enabled={variant.is_enabled} />
                  }
                  description={getVariantDescription(variant)}
                  className="space-y-1.5 px-2.5 py-2"
                  leftAction={
                    <VariantToggleForm
                      product={product}
                      index={index}
                      variant={variant}
                    />
                  }
                  rightAction={
                    <>
                      <CompactRecordActionButton
                        aria-label={`View variant ${variant.name}`}
                        onClick={() => setViewVariant(variant)}
                      >
                        <Eye aria-hidden="true" />
                      </CompactRecordActionButton>
                      <CompactRecordActionButton
                        aria-label={`Edit variant ${variant.name}`}
                        onClick={() =>
                          setActiveVariant({ mode: "edit", index, variant })
                        }
                      >
                        <Pencil aria-hidden="true" />
                      </CompactRecordActionButton>
                    </>
                  }
                />
              </ThemedCard>
            ))
          )}
        </div>
      </div>

      {product ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto flex max-w-5xl justify-end">
            <ThemedButton
              type="button"
              size="icon"
              aria-label="Add variant"
              className="size-10 rounded-md p-0 shadow-sm sm:size-8"
              onClick={() => setActiveVariant({ mode: "create" })}
            >
              <Plus aria-hidden="true" />
            </ThemedButton>
          </div>
        </div>
      ) : null}

      {product ? (
        <VariantFormPanel
          product={product}
          activeVariant={activeVariant}
          onClose={() => setActiveVariant(null)}
        />
      ) : null}

      <ThemedSheet
        open={viewVariant !== null}
        onOpenChange={(open) => {
          if (!open) setViewVariant(null)
        }}
      >
        <ThemedSheetContent
          side="bottom"
          showCloseButton={false}
          className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        >
          {viewVariant ? (
            <>
              <ProductPanelHeader
                title={viewVariant.name}
                description="Read-only variant details."
                onClose={() => setViewVariant(null)}
              />
              <div className={PRODUCT_ADMIN_PANEL_BODY_CLASS}>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Base price
                    </p>
                    <p className="mt-1">{formatMoney(viewVariant.base_price)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Sort order
                    </p>
                    <p className="mt-1">{viewVariant.sort_order}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Status
                    </p>
                    <p className="mt-1">
                      {viewVariant.is_enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Default
                    </p>
                    <p className="mt-1">
                      {viewVariant.is_default ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
              <ProductPanelFooter
                closeControl={
                  <ThemedButton
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Close"
                    className="size-10 bg-background text-foreground hover:bg-muted"
                    onClick={() => setViewVariant(null)}
                  >
                    <X aria-hidden="true" />
                    <span className="sr-only">Close</span>
                  </ThemedButton>
                }
              />
            </>
          ) : null}
        </ThemedSheetContent>
      </ThemedSheet>
    </main>
  )
}
