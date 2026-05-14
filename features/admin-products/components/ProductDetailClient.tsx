"use client"

import Link from "next/link"
import { X } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
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
import type {
  ExistingProduct,
  ProductFormData,
} from "@/features/admin-products/components/ProductForm"

type ProductDetailClientProps = {
  data: ProductFormData
}

function getInitialCategoryId(
  menuGroups: ProductFormData["menuGroups"],
  menuGroupId: string
) {
  const selectedGroup = menuGroups.find((group) => group.id === menuGroupId)

  return selectedGroup?.parent_group_id ?? selectedGroup?.id ?? ""
}

export function ProductDetailClient({ data }: ProductDetailClientProps) {
  const { product, menuGroups, businessName } = data

  if (!product) {
    return null
  }

  return (
    <ProductDetailEditor
      product={product}
      menuGroups={menuGroups}
      businessName={businessName}
    />
  )
}

function ProductDetailEditor({
  product,
  menuGroups,
  businessName,
}: {
  product: ExistingProduct
  menuGroups: ProductFormData["menuGroups"]
  businessName: string
}) {
  const productPath = `/admin/products/${product.id}`
  const parentGroups = useMemo(
    () => menuGroups.filter((group) => !group.parent_group_id),
    [menuGroups]
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState(() =>
    getInitialCategoryId(menuGroups, product.menuGroupId)
  )
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(() => {
    const selectedGroup = menuGroups.find(
      (group) => group.id === product.menuGroupId
    )

    return selectedGroup?.parent_group_id ? selectedGroup.id : ""
  })
  const subcategoryGroups = menuGroups.filter(
    (group) => group.parent_group_id === selectedCategoryId
  )
  const selectedMenuGroupId = selectedSubcategoryId || selectedCategoryId

  return (
    <main className={PRODUCT_ADMIN_PANEL_PAGE_CLASS}>
      <ThemedSheet open>
        <ThemedSheetContent
          side="bottom"
          showCloseButton={false}
          className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        >
          <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
            <ThemedButton
              asChild
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              className="absolute top-3 right-3 bg-transparent text-foreground hover:bg-muted"
            >
              <Link href="/admin/products">
                <X aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Link>
            </ThemedButton>
            <ThemedSheetTitle className="text-3xl font-bold text-foreground">
              Edit Product
            </ThemedSheetTitle>
            <ThemedSheetDescription>
              Update product details for {businessName}.
            </ThemedSheetDescription>
          </ThemedSheetHeader>

          <form action={updateProduct} className="flex min-h-0 flex-1 flex-col">
            <div className={cn(PRODUCT_ADMIN_PANEL_BODY_CLASS, "pb-4")}>
              <ProductUpdateHiddenFields
                product={product}
                redirectTo={productPath}
                includeInfo={false}
                includeMenuPlacement={false}
                includeAvailability={false}
              />
              <input type="hidden" name="menuGroupId" value={selectedMenuGroupId} />

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Category</span>
                  <select
                    value={selectedCategoryId}
                    onChange={(event) => {
                      setSelectedCategoryId(event.target.value)
                      setSelectedSubcategoryId("")
                    }}
                    required
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Select a category</option>
                    {parentGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Subcategory</span>
                  <select
                    value={selectedSubcategoryId}
                    onChange={(event) =>
                      setSelectedSubcategoryId(event.target.value)
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">No subcategory</option>
                    {subcategoryGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Builder template</span>
                  <select
                    name="builderTemplate"
                    defaultValue={product.builder_template}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="pizza">Pizza</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Product name</span>
                  <input
                    name="name"
                    required
                    defaultValue={product.name}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={product.description ?? ""}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
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

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Status</span>
                    <select
                      name="isEnabled"
                      defaultValue={product.is_enabled ? "true" : "false"}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <ProductPanelFooter
              closeControl={
                <ThemedButton
                  asChild
                  variant="outline"
                  size="icon"
                  aria-label="Close"
                  className="size-10 bg-background text-foreground hover:bg-muted"
                >
                  <Link href="/admin/products">
                    <X aria-hidden="true" />
                    <span className="sr-only">Close</span>
                  </Link>
                </ThemedButton>
              }
              submitLabel="Save product"
            />
          </form>
        </ThemedSheetContent>
      </ThemedSheet>
    </main>
  )
}
