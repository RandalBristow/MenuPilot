import Link from "next/link"
import { Check, X } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createProduct } from "@/features/admin-products/actions/create-product"
import { updateProduct } from "@/features/admin-products/actions/update-product"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_PANEL_PAGE_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"

const BUSINESS_SLUG = "pronto-demo"

export type MenuGroup = {
  id: string
  name: string
  parent_group_id: string | null
  sort_order: number
}

export type ModifierGroup = {
  id: string
  name: string
  selection_type: string
  is_required: boolean
  sort_order: number
}

export type ExistingProduct = {
  id: string
  name: string
  description: string | null
  base_price: number | null
  builder_template: string
  is_enabled: boolean
  menuGroupId: string
  modifierGroupIds: string[]
}

export type ProductFormData = {
  businessName: string
  menuGroups: MenuGroup[]
  modifierGroups: ModifierGroup[]
  product: ExistingProduct | null
}

type ProductFormProps = {
  productId?: string
}

function sortBySortOrder<T extends { sort_order: number; name: string }>(
  items: T[]
) {
  return [...items].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}

export function getMenuGroupLabel(group: MenuGroup, groups: MenuGroup[]) {
  const parent = groups.find((item) => item.id === group.parent_group_id)

  if (!parent) {
    return group.name
  }

  return `${parent.name} / ${group.name}`
}

type RawExistingProduct = {
  id: string
  name: string
  description: string | null
  base_price: number | null
  builder_template: string
  is_enabled: boolean
  product_groups:
    | {
        menu_group_id: string
        is_primary: boolean
      }[]
    | null
  product_modifier_groups:
    | {
        modifier_group_id: string
      }[]
    | null
}

function mapExistingProduct(product: RawExistingProduct): ExistingProduct {
  const primaryProductGroup =
    product.product_groups?.find((group) => group.is_primary) ??
    product.product_groups?.[0]

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    base_price: product.base_price,
    builder_template: product.builder_template,
    is_enabled: product.is_enabled,
    menuGroupId: primaryProductGroup?.menu_group_id ?? "",
    modifierGroupIds: (product.product_modifier_groups ?? []).map(
      (group) => group.modifier_group_id
    ),
  }
}

async function getExistingProduct(
  businessId: string,
  productId?: string
): Promise<ExistingProduct | null> {
  if (!productId) return null

  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      `
      id,
      name,
      description,
      base_price,
      builder_template,
      is_enabled,
      product_groups (
        menu_group_id,
        is_primary
      ),
      product_modifier_groups (
        modifier_group_id
      )
    `
    )
    .eq("id", productId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Could not load product.")
  }

  return mapExistingProduct(data as RawExistingProduct)
}

export async function getProductFormData(
  productId?: string
): Promise<ProductFormData> {
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, name")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (businessError || !business) {
    throw new Error("Could not load product business.")
  }

  const [menuGroupsResult, modifierGroupsResult, product] = await Promise.all([
    supabaseAdmin
      .from("menu_groups")
      .select("id, name, parent_group_id, sort_order")
      .eq("business_id", business.id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("modifier_groups")
      .select("id, name, selection_type, is_required, sort_order")
      .eq("business_id", business.id)
      .order("sort_order", { ascending: true }),
    getExistingProduct(business.id as string, productId),
  ])

  if (menuGroupsResult.error) {
    throw new Error(
      `Could not load menu groups: ${menuGroupsResult.error.message}`
    )
  }

  if (modifierGroupsResult.error) {
    throw new Error(
      `Could not load modifier groups: ${modifierGroupsResult.error.message}`
    )
  }

  return {
    businessName: business.name as string,
    menuGroups: sortBySortOrder((menuGroupsResult.data ?? []) as MenuGroup[]),
    modifierGroups: sortBySortOrder(
      (modifierGroupsResult.data ?? []) as ModifierGroup[]
    ),
    product,
  }
}

export async function ProductForm({ productId }: ProductFormProps) {
  const { businessName, menuGroups, product } =
    await getProductFormData(productId)
  const isEditMode = product !== null

  return (
    <main className={PRODUCT_ADMIN_PANEL_PAGE_CLASS}>
      <ThemedSheet open>
        <ThemedSheetContent
          side="bottom"
          showCloseButton={false}
          className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        >
          <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
          <ThemedSheetTitle>
            {isEditMode ? "Edit Product" : "New Product"}
          </ThemedSheetTitle>
          <ThemedSheetDescription>
            {isEditMode
              ? `Update product details for ${businessName}.`
              : `Create a basic product for ${businessName}.`}
          </ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          action={isEditMode ? updateProduct : createProduct}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={PRODUCT_ADMIN_PANEL_BODY_CLASS}>
            {product ? (
              <>
                <input type="hidden" name="productId" value={product.id} />
                <input
                  type="hidden"
                  name="isEnabled"
                  value={String(product.is_enabled)}
                />
                {product.modifierGroupIds.map((modifierGroupId) => (
                  <input
                    key={modifierGroupId}
                    type="hidden"
                    name="modifierGroupIds"
                    value={modifierGroupId}
                  />
                ))}
              </>
            ) : null}

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Product name</span>
                <input
                  name="name"
                  required
                  defaultValue={product?.name ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={product?.description ?? ""}
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
                  defaultValue={product?.base_price ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Builder template</span>
                <select
                  name="builderTemplate"
                  defaultValue={product?.builder_template ?? "standard"}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="pizza">Pizza</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">
                  Category / subcategory
                </span>
                <select
                  name="menuGroupId"
                  required
                  defaultValue={product?.menuGroupId ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select a menu group</option>
                  {menuGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {getMenuGroupLabel(group, menuGroups)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

          </div>

          <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
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
            <ThemedButton
              type="submit"
              size="icon"
              aria-label={isEditMode ? "Save product" : "Create product"}
              className="size-10"
            >
              <Check aria-hidden="true" />
              <span className="sr-only">
                {isEditMode ? "Save product" : "Create product"}
              </span>
            </ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
      </ThemedSheet>
    </main>
  )
}
