import { supabaseAdmin } from "@/lib/supabase/admin"
import type {
  ModifierGroupCategory,
  RawModifierGroup,
} from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

const BUSINESS_SLUG = "pronto-demo"

type RawModifierGroupCategory = {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_enabled: boolean
  modifier_groups: RawModifierGroup[] | null
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

function mapCategory(category: RawModifierGroupCategory) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    sort_order: category.sort_order,
    is_enabled: category.is_enabled,
    modifier_groups: sortBySortOrder(category.modifier_groups ?? []).map(
      (group) => ({
        ...group,
        modifier_option_groups: sortBySortOrder(
          group.modifier_option_groups ?? []
        ),
        modifier_options: sortBySortOrder(group.modifier_options ?? []),
      })
    ),
  }
}

export async function getModifierAdminData() {
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, name")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (businessError || !business) {
    throw new Error("Could not load modifier business.")
  }

  const { data, error } = await supabaseAdmin
    .from("modifier_group_categories")
    .select(
      `
      id,
      name,
      description,
      sort_order,
      is_enabled,
      modifier_groups (
        id,
        name,
        selection_type,
        min_required,
        max_allowed,
        is_required,
        is_enabled,
        sort_order,
        modifier_option_groups (
          id,
          name,
          description,
          sort_order,
          is_enabled
        ),
        modifier_options (
          id,
          name,
          price_delta,
          modifier_option_group_id,
          sort_order,
          is_enabled
        )
      )
    `
    )
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Could not load modifier categories: ${error.message}`)
  }

  return {
    businessName: business.name as string,
    categories: sortBySortOrder(
      ((data ?? []) as RawModifierGroupCategory[]).map(mapCategory)
    ) as ModifierGroupCategory[],
  }
}
