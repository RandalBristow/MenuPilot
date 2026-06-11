import { supabase } from "@/lib/supabase/client"
import type {
  OrderableDealComponentPricingMode,
  PublicOrderableDeal,
} from "@/features/specials/types/orderable-deal"
import { isSpecialCurrentlyEligible } from "@/features/specials/utils/special-schedule"
import {
  resolveOperationalAvailabilityForRecords,
  type RawOperationalAvailabilityRecord,
} from "@/features/availability/utils/operational-availability-records"

type RawDealProduct = {
  id: string
  name: string
  description: string | null
  base_price: number | string | null
  builder_template: string | null
  has_variants: boolean
  is_enabled: boolean
  business_id: string
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

type RawDealComponentProduct = {
  sort_order: number
  products: RawDealProduct | RawDealProduct[] | null
  special_component_product_variant_options?:
    | Array<{
        variant_group_option_id: string
      }>
    | null
}

type RawDealComponentModifierOverride = {
  product_id: string
  modifier_group_id: string
  included_selection_count: number | string
}

type RawDealComponent = {
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
  special_component_products: RawDealComponentProduct[] | null
  special_component_modifier_group_overrides?:
    | RawDealComponentModifierOverride[]
    | null
}

type RawDealAvailabilityWindow = {
  id: string
  day_of_week: number
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
}

type RawOrderableDeal = {
  id: string
  business_id: string
  name: string
  customer_description: string | null
  special_type: string
  discount_value: number | string
  is_enabled: boolean
  starts_at: string | null
  ends_at: string | null
  special_components: RawDealComponent[] | null
  special_availability_windows: RawDealAvailabilityWindow[] | null
}

type LoadPublicOrderableDealInput = {
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

function getProductMediaAsset(product: RawDealProduct) {
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

export function mapPublicOrderableDeal({
  rawDeal,
  businessSlug = null,
  businessId,
  currentTime,
  timeZone,
}: {
  rawDeal: RawOrderableDeal
  businessSlug?: string | null
  businessId: string
  currentTime: Date
  timeZone?: string | null
}): PublicOrderableDeal | null {
  if (rawDeal.business_id !== businessId) return null
  if (rawDeal.special_type !== "orderable_deal") return null

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
    dealBasePrice: toNumber(rawDeal.discount_value),
    isEnabled: rawDeal.is_enabled,
    startsAt: rawDeal.starts_at,
    endsAt: rawDeal.ends_at,
    availabilityWindows,
    components: (rawDeal.special_components ?? [])
      .map((component) => ({
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
        products: (component.special_component_products ?? [])
          .map((row) => {
            const product = firstRecord(row.products)

            return {
              sortOrder: row.sort_order,
              product,
              allowedVariantOptionIds: (
                row.special_component_product_variant_options ?? []
              ).map((restriction) => restriction.variant_group_option_id),
              modifierGroupOverrides: (
                component.special_component_modifier_group_overrides ?? []
              )
                .filter((override) => override.product_id === product?.id)
                .map((override) => ({
                  modifierGroupId: override.modifier_group_id,
                  includedSelectionCount: toNumber(
                    override.included_selection_count
                  ),
                })),
            }
          })
          .filter(
            (
              row
            ): row is {
              sortOrder: number
              product: RawDealProduct
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
                records: (
                  row.product.product_operational_availability ?? []
                ).map((record) => ({
                  id: record.id,
                  locationId: record.location_id ?? null,
                  is86d: record.is_86d,
                  reason: record.reason,
                  expiresAt: record.expires_at,
                })),
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
      }))
      .sort(
        (first, second) =>
          first.sortOrder - second.sortOrder ||
          first.label.localeCompare(second.label)
      ),
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

export async function loadPublicOrderableDeal({
  businessSlug = null,
  businessId,
  specialId,
  currentTime = new Date(),
  timeZone,
}: LoadPublicOrderableDealInput) {
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
      discount_value,
      is_enabled,
      starts_at,
      ends_at,
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
          sort_order,
          special_component_product_variant_options (
            variant_group_option_id
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
        special_component_modifier_group_overrides (
          product_id,
          modifier_group_id,
          included_selection_count
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
    .eq("special_type", "orderable_deal")
    .eq("is_enabled", true)
    .single()

  if (error || !data) return null

  return mapPublicOrderableDeal({
    rawDeal: data as RawOrderableDeal,
    businessSlug,
    businessId: resolvedBusinessId,
    currentTime,
    timeZone,
  })
}
