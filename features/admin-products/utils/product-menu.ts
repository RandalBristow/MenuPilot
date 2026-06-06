import { supabaseAdmin } from "@/lib/supabase/admin"

export const DEFAULT_PRODUCT_MENU_NAME = "Main Menu"

export function buildDefaultProductMenuInsert(businessId: string) {
  return {
    business_id: businessId,
    location_id: null,
    name: DEFAULT_PRODUCT_MENU_NAME,
    description: "Primary online ordering menu.",
    menu_type: "online",
    is_enabled: true,
    sort_order: 1,
  }
}

export async function getOrCreateProductMenuId(businessId: string) {
  const { data: menu, error: menuError } = await supabaseAdmin
    .from("menus")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", DEFAULT_PRODUCT_MENU_NAME)
    .maybeSingle()

  if (menuError) {
    throw new Error(`Could not load product menu: ${menuError.message}`)
  }

  if (menu) {
    return menu.id as string
  }

  const { data: createdMenu, error: createError } = await supabaseAdmin
    .from("menus")
    .insert(buildDefaultProductMenuInsert(businessId))
    .select("id")
    .single()

  if (createError || !createdMenu) {
    throw new Error(`Could not create product menu: ${createError?.message}`)
  }

  return createdMenu.id as string
}
