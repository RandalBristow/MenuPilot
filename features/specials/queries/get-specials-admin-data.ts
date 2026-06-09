import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import { resolveVariantsForProduct } from "@/features/product-configurator/utils/apply-effective-product-variants"
import type {
  OrderableDealComponentPricingMode,
} from "@/features/specials/types/orderable-deal"
import type {
  SpecialAvailabilityWindow,
  SpecialDiscountType,
  SpecialType,
} from "@/features/specials/types/special"
import {
  getSpecialComputedStatus,
  type SpecialAdminStatus,
} from "@/features/specials/utils/special-schedule"

export type SpecialEligibilityOption = {
  id: string
  name: string
  description: string | null
  isEnabled: boolean
  builderTemplate: string | null
  menuGroupId: string | null
  menuGroupName: string | null
  menuGroupSortOrder: number | null
  parentMenuGroupId: string | null
  parentMenuGroupName: string | null
  parentMenuGroupSortOrder: number | null
  variants: Array<{
    id: string
    name: string
    isEnabled: boolean
    sortOrder: number
  }>
  modifierGroups?: Array<{
    id: string
    name: string
    isEnabled: boolean
    isAssignmentEnabled: boolean
    sortOrder: number
    includedQuantity: number | null
  }>
}

export type SpecialMenuGroupOption = {
  id: string
  name: string
  description: string | null
  isEnabled: boolean
  parentGroupId: string | null
}

export type SpecialAdminListItem = {
  id: string
  name: string
  description: string | null
  customerDescription: string | null
  specialType: SpecialType
  discountType: SpecialDiscountType
  discountValue: number
  minOrderAmount: number | null
  startsAt: string | null
  endsAt: string | null
  isEnabled: boolean
  status: SpecialAdminStatus
  eligibilitySummary: string
  scheduleSummary: string
  availabilityWindows: SpecialAvailabilityWindow[]
  productIds: string[]
  menuGroupIds: string[]
  components: SpecialAdminComponent[]
  mixMatchRule: SpecialAdminMixMatchRule | null
}

export type SpecialAdminMixMatchRule = {
  id: string
  minQuantity: number
  maxQuantity: number | null
  unitPrice: number
  allowExtraItems: boolean
  productIds: string[]
  productVariantRestrictions: Array<{
    productId: string
    allowedVariantOptionIds: string[]
  }>
  modifierGroupOverrides: Array<{
    productId: string
    modifierGroupId: string
    includedSelectionCount: number
  }>
}

export type SpecialAdminComponent = {
  id: string
  label: string
  description: string | null
  sortOrder: number
  requiredQuantity: number
  minQuantity: number
  maxQuantity: number
  pricingBehavior: "included_base"
  pricingMode: OrderableDealComponentPricingMode
  fixedPrice: number | null
  isRequired: boolean
  productIds: string[]
  productVariantRestrictions: Array<{
    productId: string
    allowedVariantOptionIds: string[]
  }>
  modifierGroupOverrides?: Array<{
    productId: string
    modifierGroupId: string
    includedSelectionCount: number
  }>
}

export type SpecialAdminFormData = {
  business: {
    id: string
    name: string
    slug: string
  }
  special: SpecialAdminListItem | null
  products: SpecialEligibilityOption[]
  menuGroups: SpecialMenuGroupOption[]
}

type RawSpecialMixMatchRule = {
  id: string
  min_quantity: number
  max_quantity: number | null
  unit_price: number | string
  allow_extra_items: boolean
}

type RawSpecial = {
  id: string
  name: string
  description: string | null
  customer_description: string | null
  special_type: SpecialType
  discount_type: SpecialDiscountType
  discount_value: number | string
  min_order_amount: number | string | null
  starts_at: string | null
  ends_at: string | null
  is_enabled: boolean
  created_at: string
  special_availability_windows: Array<{
    id: string
    day_of_week: number
    start_time: string | null
    end_time: string | null
    is_all_day: boolean
  }> | null
  special_products: Array<{
    product_id: string
  }> | null
  special_menu_groups: Array<{
    menu_group_id: string
  }> | null
  special_components: Array<{
    id: string
    label: string
    description: string | null
    sort_order: number
    required_quantity: number
    min_quantity: number
    max_quantity: number
    pricing_behavior: "included_base"
    pricing_mode?: OrderableDealComponentPricingMode | null
    fixed_price?: number | string | null
    is_required: boolean
    special_component_products: Array<{
      id: string
      product_id: string
      special_component_product_variant_options:
        | Array<{
            variant_group_option_id: string
          }>
        | null
    }> | null
    special_component_modifier_group_overrides?: Array<{
      product_id: string
      modifier_group_id: string
      included_selection_count: number | string
    }> | null
  }> | null
  special_mix_match_rules:
    | RawSpecialMixMatchRule[]
    | RawSpecialMixMatchRule
    | null
  special_mix_match_products:
    | Array<{
        id: string
        product_id: string
        sort_order: number
        special_mix_match_product_variant_options:
          | Array<{
              variant_group_option_id: string
            }>
          | null
        special_mix_match_modifier_group_overrides:
          | Array<{
              product_id: string
              modifier_group_id: string
              included_selection_count: number | string
            }>
          | null
      }>
    | null
}

type RawProductMenuGroup = {
  id: string
  name: string
  parent_group_id: string | null
  sort_order: number | null
  is_enabled: boolean
  parent_group: RawProductParentMenuGroup | null
}

type RawProductParentMenuGroup = {
  id: string
  name: string
  sort_order: number | null
  is_enabled: boolean
}

type RawProductGroup = {
  menu_group_id: string
  is_primary: boolean
  menu_groups: RawProductMenuGroup | RawProductMenuGroup[] | null
}

export type RawProductOption = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  builder_template: string | null
  product_groups: RawProductGroup[] | null
  product_variant_groups:
    | Array<{
        id: string
        is_enabled: boolean
        sort_order: number | null
        variant_groups:
          | {
              id: string
              variant_group_options:
                | Array<{
                    id: string
                    name: string
                    base_price: number | string
                    is_default: boolean
                    is_enabled: boolean
                    sort_order: number
                  }>
                | null
            }
          | Array<{
              id: string
              variant_group_options:
                | Array<{
                    id: string
                    name: string
                    base_price: number | string
                    is_default: boolean
                    is_enabled: boolean
                    sort_order: number
                  }>
                | null
            }>
          | null
      }>
    | null
  product_variant_option_overrides:
    | Array<{
        variant_group_option_id: string
        price_override: number | string | null
        is_enabled: boolean | null
        is_default: boolean | null
        sort_order: number | null
      }>
    | null
  product_modifier_groups?:
    | Array<{
        modifier_group_id: string
        is_enabled: boolean
        sort_order: number
        modifier_groups:
          | {
              id: string
              name: string
              is_enabled: boolean
            }
          | Array<{
              id: string
              name: string
              is_enabled: boolean
            }>
          | null
      }>
    | null
  product_included_modifier_groups?:
    | Array<{
        modifier_group_id: string
        included_quantity: number | string
      }>
    | null
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0

  return typeof value === "number" ? value : Number(value)
}

function firstRecord<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null

  return value ?? null
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export function formatDiscountSummary({
  specialType,
  discountType,
  discountValue,
  mixMatchRule,
}: {
  specialType?: SpecialType
  discountType: SpecialDiscountType
  discountValue: number
  mixMatchRule?: SpecialAdminMixMatchRule | null
}) {
  if (specialType === "orderable_deal") {
    return `${formatMoney(discountValue)} base price`
  }

  if (specialType === "mix_and_match_fixed_unit_price") {
    const rule = mixMatchRule
    const unitPrice = formatMoney(rule?.unitPrice ?? discountValue)

    if (!rule) return `${unitPrice} each`
    if (rule.maxQuantity !== null) {
      return `Choose ${rule.minQuantity}-${rule.maxQuantity} for ${unitPrice} each`
    }

    return `Any ${rule.minQuantity}+ for ${unitPrice} each`
  }

  if (discountType === "percentage") return `${discountValue}% off`
  if (discountType === "fixed_price") {
    return `${formatMoney(discountValue)} fixed price`
  }

  return `${formatMoney(discountValue)} off`
}

function formatDateSummary(value: string | null, fallback: string) {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getScheduleSummary({
  startsAt,
  endsAt,
  windows,
}: {
  startsAt: string | null
  endsAt: string | null
  windows: SpecialAvailabilityWindow[]
}) {
  const dateSummary =
    startsAt || endsAt
      ? `${formatDateSummary(startsAt, "Now")} - ${formatDateSummary(
          endsAt,
          "No end"
        )}`
      : "No date limit"

  if (windows.length === 0) return `${dateSummary}; always available`

  const windowSummary = windows
    .map((window) => {
      const day = DAY_LABELS[window.dayOfWeek] ?? "Day"
      if (window.isAllDay) return `${day} all day`

      return `${day} ${window.startTime ?? ""}-${window.endTime ?? ""}`
    })
    .join(", ")

  return `${dateSummary}; ${windowSummary}`
}

function getEligibilitySummary({
  productIds,
  menuGroupIds,
  productNamesById,
  menuGroupNamesById,
}: {
  productIds: string[]
  menuGroupIds: string[]
  productNamesById: Map<string, string>
  menuGroupNamesById: Map<string, string>
}) {
  const labels = [
    ...productIds.map((id) => productNamesById.get(id) ?? "Product"),
    ...menuGroupIds.map((id) => menuGroupNamesById.get(id) ?? "Category"),
  ]

  if (labels.length === 0) return "All eligible lines"
  if (labels.length <= 3) return labels.join(", ")

  return `${labels.slice(0, 3).join(", ")} + ${labels.length - 3} more`
}

function getMixMatchEligibilitySummary({
  mixMatchRule,
}: {
  mixMatchRule: SpecialAdminMixMatchRule | null
}) {
  if (!mixMatchRule) return "No mix rule"

  const count = mixMatchRule.productIds.length

  return `${count} pool ${count === 1 ? "product" : "products"}`
}

export function mapRawSpecial({
  special,
  productNamesById,
  menuGroupNamesById,
  currentTime,
}: {
  special: RawSpecial
  productNamesById: Map<string, string>
  menuGroupNamesById: Map<string, string>
  currentTime: Date
}): SpecialAdminListItem {
  const availabilityWindows = (special.special_availability_windows ?? []).map(
    (window) => ({
      id: window.id,
      dayOfWeek: window.day_of_week,
      startTime: window.start_time,
      endTime: window.end_time,
      isAllDay: window.is_all_day,
    })
  )
  const productIds = (special.special_products ?? []).map(
    (row) => row.product_id
  )
  const menuGroupIds = (special.special_menu_groups ?? []).map(
    (row) => row.menu_group_id
  )
  const components = (special.special_components ?? [])
    .map((component) => {
      const componentProducts = component.special_component_products ?? []

      return {
        id: component.id,
        label: component.label,
        description: component.description,
        sortOrder: component.sort_order,
        requiredQuantity: component.required_quantity,
        minQuantity: component.min_quantity,
        maxQuantity: component.max_quantity,
        pricingBehavior: component.pricing_behavior,
        pricingMode: component.pricing_mode ?? "included",
        fixedPrice:
          component.fixed_price === null || component.fixed_price === undefined
            ? null
            : toNumber(component.fixed_price),
        isRequired: component.is_required,
        productIds: componentProducts.map((row) => row.product_id),
        productVariantRestrictions: componentProducts
          .map((row) => ({
            productId: row.product_id,
            allowedVariantOptionIds: (
              row.special_component_product_variant_options ?? []
            ).map((restriction) => restriction.variant_group_option_id),
          }))
          .filter((restriction) => restriction.allowedVariantOptionIds.length > 0),
        modifierGroupOverrides: (
          component.special_component_modifier_group_overrides ?? []
        ).map((override) => ({
          productId: override.product_id,
          modifierGroupId: override.modifier_group_id,
          includedSelectionCount: toNumber(override.included_selection_count),
        })),
      }
    })
    .sort(
      (first, second) =>
        first.sortOrder - second.sortOrder ||
        first.label.localeCompare(second.label)
    )
  const mixProductRows = [...(special.special_mix_match_products ?? [])].sort(
    (first, second) => first.sort_order - second.sort_order
  )
  const rawMixRule = firstRecord(special.special_mix_match_rules)
  const mixMatchRule = rawMixRule
    ? {
        id: rawMixRule.id,
        minQuantity: rawMixRule.min_quantity,
        maxQuantity: rawMixRule.max_quantity,
        unitPrice: toNumber(rawMixRule.unit_price),
        allowExtraItems: rawMixRule.allow_extra_items,
        productIds: mixProductRows.map((row) => row.product_id),
        productVariantRestrictions: mixProductRows
          .map((row) => ({
            productId: row.product_id,
            allowedVariantOptionIds: (
              row.special_mix_match_product_variant_options ?? []
            ).map((restriction) => restriction.variant_group_option_id),
          }))
          .filter((restriction) => restriction.allowedVariantOptionIds.length > 0),
        modifierGroupOverrides: mixProductRows.flatMap((row) =>
          (row.special_mix_match_modifier_group_overrides ?? []).map(
            (override) => ({
              productId: override.product_id,
              modifierGroupId: override.modifier_group_id,
              includedSelectionCount: toNumber(
                override.included_selection_count
              ),
            })
          )
        ),
      }
    : null

  return {
    id: special.id,
    name: special.name,
    description: special.description,
    customerDescription: special.customer_description,
    specialType: special.special_type,
    discountType: special.discount_type,
    discountValue: toNumber(special.discount_value),
    minOrderAmount:
      special.min_order_amount === null
        ? null
        : toNumber(special.min_order_amount),
    startsAt: special.starts_at,
    endsAt: special.ends_at,
    isEnabled: special.is_enabled,
    status: getSpecialComputedStatus({
      isEnabled: special.is_enabled,
      startsAt: special.starts_at,
      endsAt: special.ends_at,
      availabilityWindows,
      currentTime,
    }),
    eligibilitySummary:
      special.special_type === "orderable_deal"
        ? `${components.length} ${components.length === 1 ? "component" : "components"}`
        : special.special_type === "mix_and_match_fixed_unit_price"
          ? getMixMatchEligibilitySummary({ mixMatchRule })
        : getEligibilitySummary({
            productIds,
            menuGroupIds,
            productNamesById,
            menuGroupNamesById,
          }),
    scheduleSummary: getScheduleSummary({
      startsAt: special.starts_at,
      endsAt: special.ends_at,
      windows: availabilityWindows,
    }),
    availabilityWindows,
    productIds,
    menuGroupIds,
    components,
    mixMatchRule,
  }
}

function normalizeMenuGroup(menuGroup: RawProductGroup["menu_groups"]) {
  return Array.isArray(menuGroup) ? (menuGroup[0] ?? null) : menuGroup
}

export function mapProductOptions(
  products: RawProductOption[]
): SpecialEligibilityOption[] {
  return products
    .map((product) => {
      const primaryProductGroup =
        product.product_groups?.find((group) => group.is_primary) ??
        product.product_groups?.[0] ??
        null
      const menuGroup = normalizeMenuGroup(primaryProductGroup?.menu_groups ?? null)
      const parentGroup = menuGroup?.parent_group ?? null
      const category = parentGroup ?? menuGroup
      const subcategory = parentGroup ? menuGroup : null

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        isEnabled: Boolean(product.is_enabled),
        builderTemplate: product.builder_template,
        menuGroupId: subcategory?.id ?? category?.id ?? null,
        menuGroupName: subcategory?.name ?? category?.name ?? null,
        menuGroupSortOrder: subcategory?.sort_order ?? category?.sort_order ?? null,
        parentMenuGroupId: category?.id ?? null,
        parentMenuGroupName: category?.name ?? null,
        parentMenuGroupSortOrder: category?.sort_order ?? null,
        variants: resolveVariantsForProduct(product).map((variant) => ({
          id: variant.id,
          name: variant.name,
          isEnabled: variant.is_enabled,
          sortOrder: variant.sort_order,
        })),
        modifierGroups: (product.product_modifier_groups ?? [])
          .map((assignment) => {
            const group = normalizeModifierGroup(assignment.modifier_groups)
            const includedRule = product.product_included_modifier_groups?.find(
              (rule) => rule.modifier_group_id === group?.id
            )

            if (!group) return null

            return {
              id: group.id,
              name: group.name,
              isEnabled: group.is_enabled,
              isAssignmentEnabled: assignment.is_enabled,
              sortOrder: assignment.sort_order,
              includedQuantity: includedRule
                ? toNumber(includedRule.included_quantity)
                : null,
            }
          })
          .filter(
            (
              group
            ): group is NonNullable<
              SpecialEligibilityOption["modifierGroups"]
            >[number] =>
              group !== null
          )
          .sort(
            (first, second) =>
              first.sortOrder - second.sortOrder ||
              first.name.localeCompare(second.name)
          ),
      }
    })
    .sort((first, second) => {
      const firstCategorySort = first.parentMenuGroupSortOrder ?? 9999
      const secondCategorySort = second.parentMenuGroupSortOrder ?? 9999

      if (firstCategorySort !== secondCategorySort) {
        return firstCategorySort - secondCategorySort
      }

      const categoryNameCompare = (first.parentMenuGroupName ?? "Uncategorized")
        .localeCompare(second.parentMenuGroupName ?? "Uncategorized")

      if (categoryNameCompare !== 0) return categoryNameCompare

      const firstGroupSort = first.menuGroupSortOrder ?? 9999
      const secondGroupSort = second.menuGroupSortOrder ?? 9999

      if (firstGroupSort !== secondGroupSort) return firstGroupSort - secondGroupSort

      return first.name.localeCompare(second.name)
    })
}

function normalizeModifierGroup(
  modifierGroup:
    | NonNullable<RawProductOption["product_modifier_groups"]>[number]["modifier_groups"]
    | null
) {
  return Array.isArray(modifierGroup) ? (modifierGroup[0] ?? null) : modifierGroup
}

async function getBusinessOrNotFound(businessSlug: string) {
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) notFound()

  return business
}

async function loadSpecialOptions(businessId: string) {
  const [productsResult, menuGroupsResult] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(
        `
        id,
        name,
        description,
        is_enabled,
        builder_template,
        product_groups (
          menu_group_id,
          is_primary,
          menu_groups (
            id,
            name,
            parent_group_id,
            sort_order,
            is_enabled,
            parent_group:parent_group_id (
              id,
              name,
              sort_order,
              is_enabled
            )
          )
        ),
        product_variant_groups (
          id,
          is_enabled,
          sort_order,
          variant_groups (
            id,
            variant_group_options (
              id,
              name,
              base_price,
              is_default,
              is_enabled,
              sort_order
            )
          )
        ),
        product_variant_option_overrides (
          variant_group_option_id,
          price_override,
          is_enabled,
          is_default,
          sort_order
        ),
        product_modifier_groups (
          modifier_group_id,
          is_enabled,
          sort_order,
          modifier_groups (
            id,
            name,
            is_enabled
          )
        ),
        product_included_modifier_groups (
          modifier_group_id,
          included_quantity
        )
      `
      )
      .eq("business_id", businessId)
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("menu_groups")
      .select("id, name, description, is_enabled, parent_group_id, sort_order")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true }),
  ])

  if (productsResult.error) {
    throw new Error(`Could not load products: ${productsResult.error.message}`)
  }

  if (menuGroupsResult.error) {
    throw new Error(
      `Could not load menu groups: ${menuGroupsResult.error.message}`
    )
  }

  return {
    products: mapProductOptions((productsResult.data ?? []) as RawProductOption[]),
    menuGroups: (menuGroupsResult.data ?? []).map((group) => ({
      id: group.id as string,
      name: group.name as string,
      description: group.description as string | null,
      isEnabled: Boolean(group.is_enabled),
      parentGroupId: group.parent_group_id as string | null,
    })),
  }
}

async function loadRawSpecials(businessId: string, specialId?: string) {
  let query = supabaseAdmin
    .from("specials")
    .select(
      `
      id,
      name,
      description,
      customer_description,
      special_type,
      discount_type,
      discount_value,
      min_order_amount,
      starts_at,
      ends_at,
      is_enabled,
      created_at,
      special_availability_windows (
        id,
        day_of_week,
        start_time,
        end_time,
        is_all_day
      ),
      special_products (
        product_id
      ),
      special_menu_groups (
        menu_group_id
      ),
      special_components (
        id,
        label,
        description,
        sort_order,
        required_quantity,
        min_quantity,
        max_quantity,
        pricing_behavior,
        pricing_mode,
        fixed_price,
        is_required,
        special_component_products (
          id,
          product_id,
          special_component_product_variant_options (
            variant_group_option_id
          )
        ),
        special_component_modifier_group_overrides (
          product_id,
          modifier_group_id,
          included_selection_count
        )
      ),
      special_mix_match_rules (
        id,
        min_quantity,
        max_quantity,
        unit_price,
        allow_extra_items
      ),
      special_mix_match_products (
        id,
        product_id,
        sort_order,
        special_mix_match_product_variant_options (
          variant_group_option_id
        ),
        special_mix_match_modifier_group_overrides (
          product_id,
          modifier_group_id,
          included_selection_count
        )
      )
    `
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })

  if (specialId) {
    query = query.eq("id", specialId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Could not load specials: ${error.message}`)
  }

  return (data ?? []) as RawSpecial[]
}

export async function getSpecialsAdminData(businessSlug: string) {
  const business = await getBusinessOrNotFound(businessSlug)
  const currentTime = new Date()
  const { products, menuGroups } = await loadSpecialOptions(business.id)
  const productNamesById = new Map(products.map((item) => [item.id, item.name]))
  const menuGroupNamesById = new Map(
    menuGroups.map((item) => [item.id, item.name])
  )
  const specials = await loadRawSpecials(business.id)

  return {
    business,
    products,
    menuGroups,
    specials: specials.map((special) =>
      mapRawSpecial({
        special,
        productNamesById,
        menuGroupNamesById,
        currentTime,
      })
    ),
  }
}

export async function getSpecialAdminFormData({
  businessSlug,
  specialId,
}: {
  businessSlug: string
  specialId?: string
}): Promise<SpecialAdminFormData> {
  const business = await getBusinessOrNotFound(businessSlug)
  const currentTime = new Date()
  const { products, menuGroups } = await loadSpecialOptions(business.id)
  const productNamesById = new Map(products.map((item) => [item.id, item.name]))
  const menuGroupNamesById = new Map(
    menuGroups.map((item) => [item.id, item.name])
  )
  const specials = specialId ? await loadRawSpecials(business.id, specialId) : []

  if (specialId && specials.length === 0) notFound()

  return {
    business,
    products,
    menuGroups,
    special: specials[0]
      ? mapRawSpecial({
          special: specials[0],
          productNamesById,
          menuGroupNamesById,
          currentTime,
        })
      : null,
  }
}
