import { supabase } from "@/lib/supabase/client"
import type { PublicMixAndMatchDeal } from "@/features/specials/types/mix-and-match-deal"
import { isSpecialCurrentlyEligible } from "@/features/specials/utils/special-schedule"
import {
  resolveOperationalAvailabilityForRecords,
  type RawOperationalAvailabilityRecord,
} from "@/features/availability/utils/operational-availability-records"

type RawMixProduct = {
  id: string
  business_id: string
  name: string
  description: string | null
  base_price: number | string | null
  builder_template: string | null
  has_variants: boolean
  is_enabled: boolean
  product_operational_availability?: RawOperationalAvailabilityRecord[] | null
  image_media_id?: string | null
  media_assets?:
    | {
        id: string
        public_url: string | null
        alt_text: string | null
        caption: string | null
        is_archived: boolean
      }
    | {
        id: string
        public_url: string | null
        alt_text: string | null
        caption: string | null
        is_archived: boolean
      }[]
    | null
}

type RawMixPoolProduct = {
  id: string
  product_id: string
  sort_order: number
  products: RawMixProduct | RawMixProduct[] | null
  special_mix_match_product_variant_options?:
    | Array<{
        variant_group_option_id: string
      }>
    | null
  special_mix_match_modifier_group_overrides?:
    | Array<{
        modifier_group_id: string
        included_selection_count: number | string
      }>
    | null
}

type RawMixRule = {
  min_quantity: number
  max_quantity: number | null
  unit_price: number | string
  allow_extra_items: boolean
}

type RawMixAvailabilityWindow = {
  id: string
  day_of_week: number
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
}

type RawMixAndMatchDeal = {
  id: string
  business_id: string
  name: string
  customer_description: string | null
  special_type: string
  is_enabled: boolean
  starts_at: string | null
  ends_at: string | null
  special_mix_match_rules: RawMixRule[] | RawMixRule | null
  special_mix_match_products: RawMixPoolProduct[] | null
  special_availability_windows: RawMixAvailabilityWindow[] | null
}

type LoadPublicMixAndMatchDealInput = {
  businessSlug?: string | null
  businessId?: string | null
  specialId: string
  currentTime?: Date
  timeZone?: string | null
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0

  return typeof value === "number" ? value : Number(value)
}

function firstRecord<T>(value: T | T[] | null) {
  if (Array.isArray(value)) return value[0] ?? null

  return value
}

function getProductMediaAsset(product: RawMixProduct) {
  const mediaAsset = firstRecord(product.media_assets ?? null)

  if (!mediaAsset || mediaAsset.is_archived) return null

  return {
    id: mediaAsset.id,
    publicUrl: mediaAsset.public_url,
    altText: mediaAsset.alt_text,
    caption: mediaAsset.caption,
    isArchived: mediaAsset.is_archived,
  }
}

function firstRule(value: RawMixRule[] | RawMixRule | null) {
  if (Array.isArray(value)) return value[0] ?? null

  return value
}

export function mapPublicMixAndMatchDeal({
  rawDeal,
  businessSlug = null,
  businessId,
  currentTime,
  timeZone,
}: {
  rawDeal: RawMixAndMatchDeal
  businessSlug?: string | null
  businessId: string
  currentTime: Date
  timeZone?: string | null
}): PublicMixAndMatchDeal | null {
  if (rawDeal.business_id !== businessId) return null
  if (rawDeal.special_type !== "mix_and_match_fixed_unit_price") return null

  const rule = firstRule(rawDeal.special_mix_match_rules)
  if (!rule) return null

  const availabilityWindows = (
    rawDeal.special_availability_windows ?? []
  ).map((window) => ({
    id: window.id,
    dayOfWeek: window.day_of_week,
    startTime: window.start_time,
    endTime: window.end_time,
    isAllDay: window.is_all_day,
  }))

  if (
    !isSpecialCurrentlyEligible({
      isEnabled: rawDeal.is_enabled,
      startsAt: rawDeal.starts_at,
      endsAt: rawDeal.ends_at,
      availabilityWindows,
      currentTime,
      timeZone,
    })
  ) {
    return null
  }

  return {
    id: rawDeal.id,
    businessId: rawDeal.business_id,
    businessSlug,
    name: rawDeal.name,
    customerDescription: rawDeal.customer_description,
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
    products: (rawDeal.special_mix_match_products ?? [])
      .map((row) => {
        const product = firstRecord(row.products)

        return {
          sortOrder: row.sort_order,
          product,
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
      .filter(
        (
          row
        ): row is {
          sortOrder: number
          product: RawMixProduct
          allowedVariantOptionIds: string[]
          modifierGroupOverrides: Array<{
            modifierGroupId: string
            includedSelectionCount: number
          }>
        } =>
          row.product !== null &&
          row.product.business_id === rawDeal.business_id &&
          resolveOperationalAvailabilityForRecords({
            isPermanentlyEnabled: row.product.is_enabled,
            records: (row.product.product_operational_availability ?? []).map(
              (record) => ({
                id: record.id,
                locationId: record.location_id ?? null,
                is86d: record.is_86d,
                reason: record.reason,
                expiresAt: record.expires_at,
              })
            ),
            currentTime,
          }).isOperationallyAvailable
      )
      .sort(
        (first, second) =>
          first.sortOrder - second.sortOrder ||
          first.product.name.localeCompare(second.product.name)
      )
      .map(({ product, allowedVariantOptionIds, modifierGroupOverrides }) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: toNumber(product.base_price),
        builderTemplate: product.builder_template,
        hasVariants: product.has_variants,
        imageMediaId: product.image_media_id ?? null,
        mediaAsset: getProductMediaAsset(product),
        allowedVariantOptionIds,
        modifierGroupOverrides,
      })),
  }
}

async function resolveBusinessIdFromSlug(businessSlug: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug.trim().toLowerCase())
    .single()

  if (error || !data) {
    throw new Error(`Could not resolve business: ${error?.message}`)
  }

  return data.id as string
}

export async function loadPublicMixAndMatchDeal({
  businessSlug = null,
  businessId,
  specialId,
  currentTime = new Date(),
  timeZone,
}: LoadPublicMixAndMatchDealInput) {
  const resolvedBusinessId =
    businessId ?? (businessSlug ? await resolveBusinessIdFromSlug(businessSlug) : null)

  if (!resolvedBusinessId) return null

  const { data, error } = await supabase
    .from("specials")
    .select(
      `
      id,
      business_id,
      name,
      customer_description,
      special_type,
      is_enabled,
      starts_at,
      ends_at,
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
          modifier_group_id,
          included_selection_count
        ),
        products (
          id,
          name,
          description,
          base_price,
          builder_template,
          has_variants,
          is_enabled,
          business_id,
          image_media_id,
          product_operational_availability (
            id,
            location_id,
            is_86d,
            reason,
            expires_at
          ),
          media_assets (
            id,
            public_url,
            alt_text,
            caption,
            is_archived
          )
        )
      ),
      special_availability_windows (
        id,
        day_of_week,
        start_time,
        end_time,
        is_all_day
      )
    `
    )
    .eq("id", specialId)
    .eq("business_id", resolvedBusinessId)
    .eq("special_type", "mix_and_match_fixed_unit_price")
    .eq("is_enabled", true)
    .single()

  if (error || !data) return null

  return mapPublicMixAndMatchDeal({
    rawDeal: data as RawMixAndMatchDeal,
    businessSlug,
    businessId: resolvedBusinessId,
    currentTime,
    timeZone,
  })
}
