import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  AdminProductsBrowser,
  type AdminMenuGroup,
} from "@/features/admin-products/components/AdminProductsBrowser"
import {
  type ProductAdminBusinessContextInput,
  resolveProductAdminBusinessContext,
} from "@/features/admin-products/utils/product-admin-business-context"

type RawProductGroup = {
  id: string
  sort_order: number
  products:
    | {
        id: string
        name: string
        slug: string | null
        description: string | null
        base_price: number | null
        builder_template: string
        has_variants: boolean
        is_enabled: boolean
      }
    | {
        id: string
        name: string
        slug: string | null
        description: string | null
        base_price: number | null
        builder_template: string
        has_variants: boolean
        is_enabled: boolean
      }[]
    | null
}

type RawMenuGroup = {
  id: string
  name: string
  slug: string | null
  description: string | null
  parent_group_id: string | null
  sort_order: number
  product_groups: RawProductGroup[] | null
}

function sortBySortOrder<T extends { sort_order: number; name?: string }>(
  items: T[]
) {
  return [...items].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return (first.name ?? "").localeCompare(second.name ?? "")
  })
}

function mapProductGroup(productGroup: RawProductGroup) {
  const product = Array.isArray(productGroup.products)
    ? productGroup.products[0]
    : productGroup.products

  return {
    id: productGroup.id,
    sort_order: productGroup.sort_order,
    product,
  }
}

function mapMenuGroup(group: RawMenuGroup): AdminMenuGroup {
  return {
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    parent_group_id: group.parent_group_id,
    sort_order: group.sort_order,
    product_groups: sortBySortOrder(group.product_groups ?? []).map(
      mapProductGroup
    ),
  }
}

export async function getAdminProductsPageData(
  businessContext: ProductAdminBusinessContextInput = {}
) {
  const business = await resolveProductAdminBusinessContext(businessContext)
  const { data, error } = await supabaseAdmin
    .from("menu_groups")
    .select(
      `
      id,
      name,
      slug,
      description,
      parent_group_id,
      sort_order,
      product_groups (
        id,
        sort_order,
        products (
          id,
          name,
          slug,
          description,
          base_price,
          builder_template,
          has_variants,
          is_enabled
        )
      )
    `
    )
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Could not load products: ${error.message}`)
  }

  return {
    businessName: business.name,
    menuGroups: sortBySortOrder(((data ?? []) as RawMenuGroup[]).map(mapMenuGroup)),
  }
}

type AdminProductsPageProps = {
  businessContext?: ProductAdminBusinessContextInput
  businessSlug?: string
  writesEnabled?: boolean
}

export async function AdminProductsPage({
  businessContext,
  businessSlug,
  writesEnabled = true,
}: AdminProductsPageProps = {}) {
  const { businessName, menuGroups } =
    await getAdminProductsPageData(businessContext)

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-col space-y-4">
        <div className="shrink-0 space-y-3">
          <ThemedHeading>Product Management</ThemedHeading>
          <p className="text-sm text-muted-foreground">
            Products, menu categories, and modifier attachments for{" "}
            {businessName}.
          </p>
        </div>

        <div className="min-h-0 flex-1">
          <AdminProductsBrowser
            menuGroups={menuGroups}
            businessSlug={businessSlug}
            writesEnabled={writesEnabled}
          />
        </div>
      </div>
    </main>
  )
}
