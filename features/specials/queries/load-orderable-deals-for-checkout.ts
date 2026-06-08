import { supabaseAdmin } from "@/lib/supabase/admin"
import type { OrderableDealCandidate } from "@/features/specials/utils/validate-and-price-orderable-deal"
import { getSpecialComputedStatus } from "@/features/specials/utils/special-schedule"
import type { SpecialAvailabilityWindow } from "@/features/specials/types/special"

type RawAvailabilityWindow = {
  id: string
  day_of_week: number
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
}

type RawComponentProduct = {
  product_id?: string
  products:
    | { id: string; business_id: string; is_enabled: boolean }
    | { id: string; business_id: string; is_enabled: boolean }[]
    | null
  special_component_product_variant_options:
    | Array<{
        variant_group_option_id: string
      }>
    | null
}

type RawComponent = {
  id: string
  label: string
  sort_order: number
  required_quantity: number
  min_quantity: number
  max_quantity: number
  pricing_behavior: "included_base"
  is_required: boolean
  special_component_products: RawComponentProduct[] | null
  special_component_modifier_group_overrides?:
    | Array<{
        product_id: string
        modifier_group_id: string
        included_selection_count: number | string
      }>
    | null
}

type RawDeal = {
  id: string
  business_id: string
  name: string
  special_type: string
  discount_value: number | string
  is_enabled: boolean
  starts_at: string | null
  ends_at: string | null
  special_availability_windows: RawAvailabilityWindow[] | null
  special_components: RawComponent[] | null
}

export type LoadOrderableDealsForCheckoutInput = {
  businessId: string
  specialIds: string[]
  currentTime: Date
  timeZone?: string | null
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0

  return typeof value === "number" ? value : Number(value)
}

function firstRecord<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null

  return value ?? null
}

function mapAvailabilityWindows(
  windows: RawAvailabilityWindow[] | null
): SpecialAvailabilityWindow[] {
  return (windows ?? []).map((window) => ({
    id: window.id,
    dayOfWeek: window.day_of_week,
    startTime: window.start_time,
    endTime: window.end_time,
    isAllDay: window.is_all_day,
  }))
}

export function mapCheckoutOrderableDeal({
  rawDeal,
  businessId,
  currentTime,
  timeZone,
}: {
  rawDeal: RawDeal
  businessId: string
  currentTime: Date
  timeZone?: string | null
}): OrderableDealCandidate | null {
  if (rawDeal.business_id !== businessId) return null
  if (rawDeal.special_type !== "orderable_deal") return null

  const availabilityWindows = mapAvailabilityWindows(
    rawDeal.special_availability_windows
  )
  const status = getSpecialComputedStatus({
    isEnabled: rawDeal.is_enabled,
    startsAt: rawDeal.starts_at,
    endsAt: rawDeal.ends_at,
    availabilityWindows,
    currentTime,
    timeZone,
  })

  if (status !== "active") return null

  return {
    businessId: rawDeal.business_id,
    specialId: rawDeal.id,
    name: rawDeal.name,
    specialType: "orderable_deal",
    isEnabled: rawDeal.is_enabled,
    startsAt: rawDeal.starts_at,
    endsAt: rawDeal.ends_at,
    availabilityWindows,
    dealBasePrice: toNumber(rawDeal.discount_value),
    components: (rawDeal.special_components ?? [])
      .map((component) => ({
        componentId: component.id,
        label: component.label,
        sortOrder: component.sort_order,
        requiredQuantity: component.required_quantity,
        minQuantity: component.min_quantity,
        maxQuantity: component.max_quantity,
        pricingBehavior: component.pricing_behavior,
        isRequired: component.is_required,
        allowedProductIds: (component.special_component_products ?? [])
          .map((row) => firstRecord(row.products))
          .filter(
            (
              product
            ): product is {
              id: string
              business_id: string
              is_enabled: boolean
            } =>
              product !== null &&
              product.business_id === rawDeal.business_id &&
              product.is_enabled
          )
          .map((product) => product.id),
        allowedProductVariantOptions: (component.special_component_products ?? [])
          .map((row) => {
            const product = firstRecord(row.products)

            if (
              !product ||
              product.business_id !== rawDeal.business_id ||
              !product.is_enabled
            ) {
              return null
            }

            return {
              productId: product.id,
              allowedVariantOptionIds: (
                row.special_component_product_variant_options ?? []
              ).map((restriction) => restriction.variant_group_option_id),
            }
          })
          .filter(
            (
              restriction
            ): restriction is {
              productId: string
              allowedVariantOptionIds: string[]
            } =>
              restriction !== null &&
              restriction.allowedVariantOptionIds.length > 0
          ),
        modifierGroupOverrides: (
          component.special_component_modifier_group_overrides ?? []
        ).map((override) => ({
          productId: override.product_id,
          modifierGroupId: override.modifier_group_id,
          includedSelectionCount: toNumber(override.included_selection_count),
        })),
      }))
      .sort(
        (first, second) =>
          first.sortOrder - second.sortOrder ||
          first.label.localeCompare(second.label)
      ),
  }
}

export async function loadOrderableDealsForCheckout({
  businessId,
  specialIds,
  currentTime,
  timeZone,
}: LoadOrderableDealsForCheckoutInput) {
  const uniqueSpecialIds = [...new Set(specialIds)]

  if (uniqueSpecialIds.length === 0) return new Map<string, OrderableDealCandidate>()

  const { data, error } = await supabaseAdmin
    .from("specials")
    .select(
      `
      id,
      business_id,
      name,
      special_type,
      discount_value,
      is_enabled,
      starts_at,
      ends_at,
      special_availability_windows (
        id,
        day_of_week,
        start_time,
        end_time,
        is_all_day
      ),
      special_components (
        id,
        label,
        sort_order,
        required_quantity,
        min_quantity,
        max_quantity,
        pricing_behavior,
        is_required,
        special_component_products (
          product_id,
          special_component_product_variant_options (
            variant_group_option_id
          ),
          products (
            id,
            business_id,
            is_enabled
          )
        ),
        special_component_modifier_group_overrides (
          product_id,
          modifier_group_id,
          included_selection_count
        )
      )
    `
    )
    .eq("business_id", businessId)
    .eq("special_type", "orderable_deal")
    .in("id", uniqueSpecialIds)

  if (error) {
    throw new Error(`Could not load orderable deals: ${error.message}`)
  }

  return new Map(
    ((data ?? []) as unknown as RawDeal[])
      .map((rawDeal) =>
        mapCheckoutOrderableDeal({
          rawDeal,
          businessId,
          currentTime,
          timeZone,
        })
      )
      .filter((deal): deal is OrderableDealCandidate => deal !== null)
      .map((deal) => [deal.specialId, deal])
  )
}
