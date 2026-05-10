import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createProduct } from "@/features/admin-products/actions/create-product"
import { updateProduct } from "@/features/admin-products/actions/update-product"
import {
  ProductVariantFields,
  type ProductFormVariant,
} from "@/features/admin-products/components/ProductVariantFields"

const BUSINESS_SLUG = "pronto-demo"

type MenuGroup = {
  id: string
  name: string
  parent_group_id: string | null
  sort_order: number
}

type ModifierGroup = {
  id: string
  name: string
  selection_type: string
  is_required: boolean
  sort_order: number
}

type ExistingProduct = {
  id: string
  name: string
  description: string | null
  base_price: number | null
  builder_template: string
  is_enabled: boolean
  menuGroupId: string
  modifierGroupIds: string[]
  variants: ProductFormVariant[]
}

type ProductFormData = {
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

function getMenuGroupLabel(group: MenuGroup, groups: MenuGroup[]) {
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
  product_variants:
    | {
        id: string
        name: string
        base_price: number
        is_default: boolean
        is_enabled: boolean
        sort_order: number
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
    variants: sortBySortOrder(product.product_variants ?? []),
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
      ),
      product_variants (
        id,
        name,
        base_price,
        is_default,
        is_enabled,
        sort_order
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

async function getProductFormData(productId?: string): Promise<ProductFormData> {
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
  const { businessName, menuGroups, modifierGroups, product } =
    await getProductFormData(productId)
  const isEditMode = product !== null
  const selectedModifierGroupIds = new Set(product?.modifierGroupIds ?? [])
  const variants = product?.variants ?? []

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <ThemedHeading>
            {isEditMode ? "Edit Product" : "New Product"}
          </ThemedHeading>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? `Update product details for ${businessName}.`
              : `Create a basic product for ${businessName}.`}
          </p>
        </div>

        <ThemedCard className="p-4 sm:p-6">
          <form
            action={isEditMode ? updateProduct : createProduct}
            className="space-y-6"
          >
            {product ? (
              <input type="hidden" name="productId" value={product.id} />
            ) : null}

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Product name</span>
                <input
                  name="name"
                  required
                  defaultValue={product?.name ?? ""}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={product?.description ?? ""}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
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
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Builder template</span>
                <select
                  name="builderTemplate"
                  defaultValue={product?.builder_template ?? "standard"}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
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
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select a menu group</option>
                  {menuGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {getMenuGroupLabel(group, menuGroups)}
                    </option>
                  ))}
                </select>
              </label>

              {isEditMode ? (
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    name="isEnabled"
                    defaultValue={product.is_enabled ? "true" : "false"}
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </label>
              ) : null}
            </div>

            <ProductVariantFields variants={variants} />

            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">Modifier groups</h2>
                <p className="text-sm text-muted-foreground">
                  Attach any modifier groups this product should use.
                </p>
              </div>

              {modifierGroups.length === 0 ? (
                <p className="rounded-md border p-3 text-sm text-muted-foreground">
                  No modifier groups are available yet.
                </p>
              ) : (
                <div className="grid gap-2">
                  {modifierGroups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-start gap-3 rounded-md border p-3"
                    >
                      <input
                        type="checkbox"
                        name="modifierGroupIds"
                        value={group.id}
                        defaultChecked={selectedModifierGroupIds.has(group.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {group.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {group.is_required ? "Required" : "Optional"} •{" "}
                          {group.selection_type}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <div className="flex justify-end">
              <ThemedButton type="submit">
                {isEditMode ? "Save Product" : "Create Product"}
              </ThemedButton>
            </div>
          </form>
        </ThemedCard>
      </div>
    </main>
  )
}
