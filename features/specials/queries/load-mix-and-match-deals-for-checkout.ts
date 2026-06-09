import { supabaseAdmin } from "@/lib/supabase/admin"
import type {
  MixAndMatchDealCandidate,
  MixAndMatchPoolProduct,
} from "@/features/specials/utils/validate-and-price-mix-and-match-deal"
import { getSpecialComputedStatus } from "@/features/specials/utils/special-schedule"
import type { SpecialAvailabilityWindow } from "@/features/specials/types/special"

type RawAvailabilityWindow = {
  id: string
  day_of_week: number
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
}

type RawMixRule = {
  min_quantity: number
  max_quantity: number | null
  unit_price: number | string
  allow_extra_items: boolean
}

type RawMixProduct = {
  product_id?: string
  sort_order: number
  products:
    | { id: string; business_id: string; is_enabled: boolean }
    | { id: string; business_id: string; is_enabled: boolean }[]
    | null
  special_mix_match_product_variant_options:
    | Array<{
        variant_group_option_id: string
      }>
    | null
  special_mix_match_modifier_group_overrides:
    | Array<{
        product_id?: string
        modifier_group_id: string
        included_selection_count: number | string
      }>
    | null
}

type RawMixDeal = {
  id: string
  business_id: string
  name: string
  special_type: string
  is_enabled: boolean
  starts_at: string | null
  ends_at: string | null
  special_availability_windows: RawAvailabilityWindow[] | null
  special_mix_match_rules: RawMixRule[] | RawMixRule | null
  special_mix_match_products: RawMixProduct[] | null
}

type MappedPoolProduct = MixAndMatchPoolProduct & {
  sortOrder: number
}

export type LoadMixAndMatchDealsForCheckoutInput = {
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

function firstRule(value: RawMixRule[] | RawMixRule | null) {
  if (Array.isArray(value)) return value[0] ?? null

  return value
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

function mapPoolProducts(rawDeal: RawMixDeal): MixAndMatchPoolProduct[] {
  return (rawDeal.special_mix_match_products ?? [])
    .map((row): MappedPoolProduct | null => {
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
        sortOrder: row.sort_order,
        allowedVariantOptionIds: (
          row.special_mix_match_product_variant_options ?? []
        ).map((restriction) => restriction.variant_group_option_id),
        modifierGroupOverrides: (
          row.special_mix_match_modifier_group_overrides ?? []
        ).map((override) => ({
          modifierGroupId: override.modifier_group_id,
          includedSelectionCount: toNumber(override.included_selection_count),
        })),
      }
    })
    .filter((product): product is MappedPoolProduct => product !== null)
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((product) => ({
      productId: product.productId,
      allowedVariantOptionIds: product.allowedVariantOptionIds,
      modifierGroupOverrides: product.modifierGroupOverrides,
    }))
}

export function mapCheckoutMixAndMatchDeal({
  rawDeal,
  businessId,
  currentTime,
  timeZone,
}: {
  rawDeal: RawMixDeal
  businessId: string
  currentTime: Date
  timeZone?: string | null
}): MixAndMatchDealCandidate | null {
  if (rawDeal.business_id !== businessId) return null
  if (rawDeal.special_type !== "mix_and_match_fixed_unit_price") return null

  const rule = firstRule(rawDeal.special_mix_match_rules)
  if (!rule) return null

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
    specialType: "mix_and_match_fixed_unit_price",
    isEnabled: rawDeal.is_enabled,
    startsAt: rawDeal.starts_at,
    endsAt: rawDeal.ends_at,
    availabilityWindows,
    rule: {
      minQuantity: rule.min_quantity,
      maxQuantity: rule.max_quantity,
      unitPrice: toNumber(rule.unit_price),
      allowExtraItems: rule.allow_extra_items,
    },
    poolProducts: mapPoolProducts(rawDeal),
  }
}

export async function loadMixAndMatchDealsForCheckout({
  businessId,
  specialIds,
  currentTime,
  timeZone,
}: LoadMixAndMatchDealsForCheckoutInput) {
  const uniqueSpecialIds = [...new Set(specialIds)]

  if (uniqueSpecialIds.length === 0) {
    return new Map<string, MixAndMatchDealCandidate>()
  }

  const { data, error } = await supabaseAdmin
    .from("specials")
    .select(
      `
      id,
      business_id,
      name,
      special_type,
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
      special_mix_match_rules (
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
        ),
        products (
          id,
          business_id,
          is_enabled
        )
      )
    `
    )
    .eq("business_id", businessId)
    .eq("special_type", "mix_and_match_fixed_unit_price")
    .in("id", uniqueSpecialIds)

  if (error) {
    throw new Error(`Could not load Mix & Match deals: ${error.message}`)
  }

  return new Map(
    ((data ?? []) as unknown as RawMixDeal[])
      .map((rawDeal) =>
        mapCheckoutMixAndMatchDeal({
          rawDeal,
          businessId,
          currentTime,
          timeZone,
        })
      )
      .filter(
        (deal): deal is MixAndMatchDealCandidate => deal !== null
      )
      .map((deal) => [deal.specialId, deal])
  )
}
