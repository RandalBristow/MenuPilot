import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductFormData,
  type ProductFormData,
} from "@/features/admin-products/components/ProductForm"
import {
  type ProductAdminBusinessContextInput,
  resolveProductAdminBusinessContext,
} from "@/features/admin-products/utils/product-admin-business-context"

export type ProductOption = {
  id: string
  name: string
  is_enabled: boolean
  menuGroupId: string | null
}

export type ProductManagementData = ProductFormData & {
  products: ProductOption[]
  selectedProductId: string | null
  selectedProductName: string | null
}

export type ProductModifierGroupOption = {
  id: string
  name: string
  selection_type: string
  is_required: boolean
  is_enabled: boolean
  sort_order: number
}

export type ProductModifierCategory = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  sort_order: number
  modifier_groups: ProductModifierGroupOption[]
}

export type ProductModifierGroupManagementData = ProductManagementData & {
  modifierCategories: ProductModifierCategory[]
  modifierAssignments: {
    id: string
    product_id: string
    modifier_group_id: string
    is_enabled: boolean
    sort_order: number
    includedRule: {
      id: string
      included_quantity: number
      charge_for_extra: boolean
    } | null
  }[]
  defaultModifierOptions: {
    id: string
    product_id: string
    modifier_group_id: string
    modifier_option_id: string
    is_enabled: boolean
  }[]
}

export async function getProductOptions(
  businessContext: ProductAdminBusinessContextInput = {}
): Promise<ProductOption[]> {
  const business = await resolveProductAdminBusinessContext(businessContext)
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      `
      id,
      name,
      is_enabled,
      product_groups (
        menu_group_id,
        is_primary
      )
    `
    )
    .eq("business_id", business.id)
    .order("name", { ascending: true })

  if (error) {
    throw new Error(`Could not load product list: ${error.message}`)
  }

  return ((data ?? []) as Array<{
    id: string
    name: string
    is_enabled: boolean
    product_groups:
      | {
          menu_group_id: string
          is_primary: boolean
        }[]
      | null
  }>)
    .map((product) => {
      const primaryGroup =
        product.product_groups?.find((group) => group.is_primary) ??
        product.product_groups?.[0]

      return {
        id: product.id,
        name: product.name,
        is_enabled: product.is_enabled,
        menuGroupId: primaryGroup?.menu_group_id ?? null,
      }
    })
    .sort((first, second) => first.name.localeCompare(second.name))
}

export async function getProductManagementData(
  requestedProductId?: string,
  businessContext: ProductAdminBusinessContextInput = {}
): Promise<ProductManagementData> {
  const business = await resolveProductAdminBusinessContext(businessContext)
  const products = await getProductOptions({ business })
  const selectedProductId =
    products.find((product) => product.id === requestedProductId)?.id ??
    products[0]?.id ??
    null
  const formData = await getProductFormData(selectedProductId ?? undefined, {
    business,
  })

  return {
    ...formData,
    products,
    selectedProductId,
    selectedProductName:
      products.find((product) => product.id === selectedProductId)?.name ??
      null,
  }
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

export async function getProductModifierGroupManagementData(
  requestedProductId?: string,
  businessContext: ProductAdminBusinessContextInput = {}
): Promise<ProductModifierGroupManagementData> {
  const business = await resolveProductAdminBusinessContext(businessContext)
  const businessId = business.id
  const productData = await getProductManagementData(requestedProductId, {
    business,
  })
  const [
    { data, error },
    assignmentsResult,
    includedRulesResult,
    defaultModifierOptionsResult,
  ] = await Promise.all([
    supabaseAdmin
    .from("modifier_categories")
    .select(
      `
      id,
      name,
      description,
      is_enabled,
      sort_order,
      modifier_groups (
        id,
        name,
        selection_type,
        is_required,
        is_enabled,
        sort_order
      )
    `
    )
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true }),
    productData.selectedProductId
      ? supabaseAdmin
          .from("product_modifier_groups")
          .select("id, product_id, modifier_group_id, is_enabled, sort_order")
          .eq("business_id", businessId)
          .eq("product_id", productData.selectedProductId)
      : Promise.resolve({ data: [], error: null }),
    productData.selectedProductId
      ? supabaseAdmin
          .from("product_included_modifier_groups")
          .select("id, modifier_group_id, included_quantity, charge_for_extra")
          .eq("business_id", businessId)
          .eq("product_id", productData.selectedProductId)
      : Promise.resolve({ data: [], error: null }),
    productData.selectedProductId
      ? supabaseAdmin
          .from("product_default_modifier_options")
          .select(
            "id, product_id, modifier_group_id, modifier_option_id, is_enabled"
          )
          .eq("business_id", businessId)
          .eq("product_id", productData.selectedProductId)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (error) {
    throw new Error(`Could not load modifier categories: ${error.message}`)
  }

  if (assignmentsResult.error) {
    throw new Error(
      `Could not load modifier assignments: ${assignmentsResult.error.message}`
    )
  }
  if (includedRulesResult.error) {
    throw new Error(
      `Could not load included modifier rules: ${includedRulesResult.error.message}`
    )
  }
  if (defaultModifierOptionsResult.error) {
    throw new Error(
      `Could not load default modifier options: ${defaultModifierOptionsResult.error.message}`
    )
  }

  const modifierCategories = ((data ?? []) as ProductModifierCategory[]).map(
    (category) => ({
      ...category,
      modifier_groups: sortBySortOrder(category.modifier_groups ?? []),
    })
  )

  return {
    ...productData,
    modifierCategories: sortBySortOrder(modifierCategories),
    defaultModifierOptions: (defaultModifierOptionsResult.data ??
      []) as ProductModifierGroupManagementData["defaultModifierOptions"],
    modifierAssignments: (assignmentsResult.data ?? []).map((assignment) => {
      const includedRule =
        includedRulesResult.data?.find(
          (rule) => rule.modifier_group_id === assignment.modifier_group_id
        ) ?? null

      return {
        ...assignment,
        includedRule: includedRule
          ? {
              id: includedRule.id as string,
              included_quantity: Number(includedRule.included_quantity),
              charge_for_extra: Boolean(includedRule.charge_for_extra),
            }
          : null,
      }
    }) as ProductModifierGroupManagementData["modifierAssignments"],
  }
}
