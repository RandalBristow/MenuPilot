import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  type ProductAdminBusinessContextInput,
  resolveProductAdminBusinessContext,
} from "@/features/admin-products/utils/product-admin-business-context"

export type ProductSubcategoryParent = {
  id: string
  name: string
  sort_order: number
}

export type ProductSubcategory = {
  id: string
  parent_group_id: string
  name: string
  description: string | null
  sort_order: number
  is_enabled: boolean
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

export async function getProductSubcategories(
  businessContext: ProductAdminBusinessContextInput = {}
) {
  const business = await resolveProductAdminBusinessContext(businessContext)
  const { data, error } = await supabaseAdmin
    .from("menu_groups")
    .select("id, parent_group_id, name, description, sort_order, is_enabled")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Could not load product subcategories: ${error.message}`)
  }

  const menuGroups = (data ?? []) as Array<
    ProductSubcategory | (ProductSubcategoryParent & { parent_group_id: null })
  >
  const categories = menuGroups.filter(
    (group): group is ProductSubcategoryParent & { parent_group_id: null } =>
      group.parent_group_id === null
  )
  const subcategories = menuGroups.filter(
    (group): group is ProductSubcategory => group.parent_group_id !== null
  )

  return {
    businessName: business.name,
    categories: sortBySortOrder(categories),
    subcategories: sortBySortOrder(subcategories),
  }
}
