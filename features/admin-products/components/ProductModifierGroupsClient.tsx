"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { CompactRecordActionButton } from "@/components/themed/CompactRecordActionButton"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { updateProduct } from "@/features/admin-products/actions/update-product"
import { ProductUpdateHiddenFields } from "@/features/admin-products/components/ProductAdminFormParts"
import type { ExistingProduct } from "@/features/admin-products/components/ProductForm"
import type {
  ProductModifierGroupManagementData,
  ProductModifierGroupOption,
} from "@/features/admin-products/queries/get-product-management-data"

type ProductModifierGroupsClientProps = {
  data: ProductModifierGroupManagementData
}

function RelationshipForm({
  product,
  modifierGroupId,
  mode,
}: {
  product: ExistingProduct
  modifierGroupId: string
  mode: "attach" | "detach"
}) {
  const nextModifierGroupIds =
    mode === "attach"
      ? [...new Set([...product.modifierGroupIds, modifierGroupId])]
      : product.modifierGroupIds.filter((id) => id !== modifierGroupId)

  return (
    <form action={updateProduct}>
      <ProductUpdateHiddenFields
        product={product}
        redirectTo={`/admin/products/modifier-groups?productId=${product.id}`}
        includeModifierGroups={false}
      />
      {nextModifierGroupIds.map((id) => (
        <input key={id} type="hidden" name="modifierGroupIds" value={id} />
      ))}
      <CompactRecordActionButton
        type="submit"
        aria-label={
          mode === "attach"
            ? "Attach modifier group"
            : "Detach modifier group"
        }
      >
        {mode === "attach" ? (
          <Plus aria-hidden="true" />
        ) : (
          <X aria-hidden="true" />
        )}
      </CompactRecordActionButton>
    </form>
  )
}

function ModifierGroupRow({
  product,
  group,
  mode,
}: {
  product: ExistingProduct
  group: ProductModifierGroupOption
  mode: "attach" | "detach"
}) {
  return (
    <ThemedCard
      className={
        group.is_enabled
          ? "overflow-hidden py-0"
          : "overflow-hidden bg-muted/30 py-0 opacity-75"
      }
    >
      <CompactRecordRow
        title={group.name}
        statusIcon={<CompactRecordStatusIcon enabled={group.is_enabled} />}
        description={`${group.is_required ? "Required" : "Optional"} - ${
          group.selection_type
        }`}
        className="space-y-1.5 px-2.5 py-2"
        rightAction={
          <RelationshipForm
            product={product}
            modifierGroupId={group.id}
            mode={mode}
          />
        }
      />
    </ThemedCard>
  )
}

export function ProductModifierGroupsClient({
  data,
}: ProductModifierGroupsClientProps) {
  const router = useRouter()
  const { products, product, businessName, modifierCategories } = data
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    modifierCategories[0]?.id ?? ""
  )
  const attachedIds = useMemo(
    () => new Set(product?.modifierGroupIds ?? []),
    [product?.modifierGroupIds]
  )
  const selectedCategory =
    modifierCategories.find((category) => category.id === selectedCategoryId) ??
    modifierCategories[0] ??
    null
  const allModifierGroups = modifierCategories.flatMap(
    (category) => category.modifier_groups
  )
  const attachedGroups = product
    ? allModifierGroups.filter((group) => attachedIds.has(group.id))
    : []
  const availableGroups =
    selectedCategory?.modifier_groups.filter((group) => !attachedIds.has(group.id)) ??
    []

  function handleProductChange(productId: string) {
    router.push(`/admin/products/modifier-groups?productId=${productId}`)
  }

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col">
        <div className="shrink-0 space-y-3 border-b pb-1.5">
          <div className="space-y-2">
            <ThemedHeading>Product Modifier Groups</ThemedHeading>
            <p className="text-sm text-muted-foreground">
              Manage modifier group attachments for {businessName}.
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
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {modifierCategories.map((category) => (
              <ThemedButton
                key={category.id}
                type="button"
                size="sm"
                onClick={() => setSelectedCategoryId(category.id)}
                className={
                  category.id === selectedCategory?.id
                    ? "shrink-0 rounded-full"
                    : "shrink-0 rounded-full border bg-background text-foreground hover:bg-muted"
                }
              >
                {category.name}
              </ThemedButton>
            ))}
          </div>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pb-4 pt-3">
          {!product ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No products yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a product before managing modifier groups.
              </p>
            </ThemedCard>
          ) : (
            <>
              <section className="space-y-2">
                <div>
                  <h2 className="text-base font-semibold">Attached</h2>
                  <p className="text-sm text-muted-foreground">
                    Modifier groups currently assigned to this product.
                  </p>
                </div>
                {attachedGroups.length === 0 ? (
                  <ThemedCard className="p-4 text-sm text-muted-foreground">
                    No modifier groups attached.
                  </ThemedCard>
                ) : (
                  <div className="space-y-2">
                    {attachedGroups.map((group) => (
                      <ModifierGroupRow
                        key={group.id}
                        product={product}
                        group={group}
                        mode="detach"
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <div>
                  <h2 className="text-base font-semibold">Available</h2>
                  <p className="text-sm text-muted-foreground">
                    Filter by modifier category, then attach what this product
                    should use.
                  </p>
                </div>
                {availableGroups.length === 0 ? (
                  <ThemedCard className="p-4 text-sm text-muted-foreground">
                    No available modifier groups in this category.
                  </ThemedCard>
                ) : (
                  <div className="space-y-2">
                    {availableGroups.map((group) => (
                      <ModifierGroupRow
                        key={group.id}
                        product={product}
                        group={group}
                        mode="attach"
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
