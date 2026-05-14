import { supabaseAdmin } from "@/lib/supabase/admin"

const BUSINESS_SLUG = "pronto-demo"

export type ProductCategory = {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_enabled: boolean
}

function sortBySortOrder(items: ProductCategory[]) {
  return [...items].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }

    return first.name.localeCompare(second.name)
  })
}

export async function getProductCategories() {
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, name")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (businessError || !business) {
    throw new Error("Could not load product business.")
  }

  const { data, error } = await supabaseAdmin
    .from("menu_groups")
    .select("id, name, description, sort_order, is_enabled")
    .eq("business_id", business.id)
    .is("parent_group_id", null)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Could not load product categories: ${error.message}`)
  }

  return {
    businessName: business.name as string,
    categories: sortBySortOrder((data ?? []) as ProductCategory[]),
  }
}
