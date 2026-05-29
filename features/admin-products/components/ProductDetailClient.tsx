"use client"

import { ThumbsDown, ThumbsUp } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import { updateProduct } from "@/features/admin-products/actions/update-product"
import {
  ProductPanelFooter,
  ProductUpdateHiddenFields,
} from "@/features/admin-products/components/ProductAdminFormParts"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_PANEL_PAGE_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import { ProductImageSelector } from "@/features/admin-products/components/ProductImageSelector"
import {
  ACTIVE_BUILDER_TEMPLATES,
  BUILDER_TEMPLATE_LABELS,
} from "@/features/product-configurator/utils/builder-templates"
import type {
  ExistingProduct,
  ProductFormData,
} from "@/features/admin-products/components/ProductForm"

type ProductDetailClientProps = {
  data: ProductFormData
}

function getProductPlacementLabel(
  menuGroups: ProductFormData["menuGroups"],
  menuGroupId: string
) {
  const group = menuGroups.find((item) => item.id === menuGroupId)

  if (!group) return "Unassigned"

  const parent = menuGroups.find((item) => item.id === group.parent_group_id)

  if (!parent) return group.name

  return `${parent.name} / ${group.name}`
}

export function ProductDetailClient({ data }: ProductDetailClientProps) {
  const { product, menuGroups, mediaAssets, businessName } = data

  if (!product) {
    return null
  }

  return (
    <ProductDetailEditor
      product={product}
      menuGroups={menuGroups}
      mediaAssets={mediaAssets}
      businessName={businessName}
    />
  )
}

function ProductDetailEditor({
  product,
  menuGroups,
  mediaAssets,
  businessName,
}: {
  product: ExistingProduct
  menuGroups: ProductFormData["menuGroups"]
  mediaAssets: ProductFormData["mediaAssets"]
  businessName: string
}) {
  const productPath = `/admin/products/${product.id}`
  const [isEnabled, setIsEnabled] = useState(product.is_enabled)
  const [hasVariants, setHasVariants] = useState(product.has_variants)
  const placementLabel = getProductPlacementLabel(menuGroups, product.menuGroupId)

  return (
    <main className={PRODUCT_ADMIN_PANEL_PAGE_CLASS}>
      <ThemedSheet open>
        <ThemedSheetContent
          side="bottom"
          showCloseButton={false}
          className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        >
          <form action={updateProduct} className="flex min-h-0 flex-1 flex-col">
            <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
              <ThemedSheetTitle>Edit Product</ThemedSheetTitle>
              <ThemedSheetDescription>
                Update product details for {businessName}.
              </ThemedSheetDescription>
              <p className="truncate text-sm text-muted-foreground">
                {placementLabel}
              </p>
            </ThemedSheetHeader>

            <div className={cn(PRODUCT_ADMIN_PANEL_BODY_CLASS, "pb-4")}>
              <ProductUpdateHiddenFields
                product={product}
                redirectTo={productPath}
                includeInfo={false}
                includeMenuPlacement={false}
                includeAvailability={false}
              />
              <input type="hidden" name="menuGroupId" value={product.menuGroupId} />
              <input type="hidden" name="isEnabled" value={String(isEnabled)} />
              {hasVariants ? (
                <input type="hidden" name="hasVariants" value="true" />
              ) : null}

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Builder template</span>
                  <select
                    name="builderTemplate"
                    defaultValue={product.builder_template}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {ACTIVE_BUILDER_TEMPLATES.map((template) => (
                      <option key={template} value={template}>
                        {BUILDER_TEMPLATE_LABELS[template]}
                      </option>
                    ))}
                    <option value="combo" disabled>
                      Combo (future)
                    </option>
                  </select>
                </label>

                <label className="flex items-start gap-3 rounded-md border bg-background px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(event) => setHasVariants(event.target.checked)}
                    className="mt-1 size-4 shrink-0"
                  />
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">Uses variants</span>
                    <span className="text-xs text-muted-foreground">
                      Enable when this product has size, count, portion, volume,
                      or similar choices.
                    </span>
                  </span>
                </label>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                  <label className="grid min-w-0 gap-2">
                    <span className="text-sm font-medium">Product name</span>
                    <input
                      name="name"
                      required
                      defaultValue={product.name}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    />
                  </label>

                  <ThemedButton
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`${isEnabled ? "Disable" : "Enable"} product ${product.name}`}
                    className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
                    onClick={() => setIsEnabled((current) => !current)}
                  >
                    {isEnabled ? (
                      <ThumbsUp aria-hidden="true" />
                    ) : (
                      <ThumbsDown aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {isEnabled ? "Disable" : "Enable"} product
                    </span>
                  </ThemedButton>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={product.description ?? ""}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Base price</span>
                  <input
                    name="basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={product.base_price ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                <ProductImageSelector
                  mediaAssets={mediaAssets}
                  initialImageMediaId={product.image_media_id}
                  productName={product.name}
                />
              </div>
            </div>

            <ProductPanelFooter
              closeControl={
                <AdminBackButton
                  fallbackHref="/admin/products/list"
                  label="Back to products"
                />
              }
              submitLabel="Save product"
            />
          </form>
        </ThemedSheetContent>
      </ThemedSheet>
    </main>
  )
}
