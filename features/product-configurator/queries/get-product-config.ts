import { supabase } from "@/lib/supabase/client"
import { applyEffectiveModifierGroups } from "@/features/product-configurator/utils/apply-effective-modifier-groups"
import type { ProductModifierOverrideSources } from "@/features/product-configurator/utils/apply-effective-modifier-groups"
import { applyEffectiveVariants } from "@/features/product-configurator/utils/apply-effective-product-variants"
import type { ProductWithVariantSources } from "@/features/product-configurator/utils/apply-effective-product-variants"
import {
  normalizeBusinessPricingSettings,
  type RawBusinessPricingSettings,
} from "@/lib/pricing/business-pricing-settings"
import {
  groupModifierOptionOperationalAvailabilityRecords,
  groupProductOperationalAvailabilityRecords,
  resolveOperationalAvailabilityForRecords,
  type RawOperationalAvailabilityRecord,
} from "@/features/availability/utils/operational-availability-records"
import type { OperationalAvailabilityOverride } from "@/features/availability/types/operational-availability"

type ProductConfigQueryOptions = {
  businessSlug?: string | null
}

async function resolveBusinessIdFromSlug(businessSlug: string) {
  const slug = businessSlug.trim().toLowerCase()

  if (!slug) return null

  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .single()

  if (error) {
    throw new Error(`Failed to resolve business: ${error.message}`)
  }

  return data.id as string
}

type ProductConfigModifierOption = {
  id: string
  is_enabled: boolean
}

type ProductConfigModifierGroup = {
  modifier_options?: ProductConfigModifierOption[] | null
}

type ProductConfigWithModifierGroups = {
  id: string
  name?: string
  is_enabled: boolean
  product_modifier_groups?: Array<{
    modifier_groups?:
      | ProductConfigModifierGroup
      | ProductConfigModifierGroup[]
      | null
  }> | null
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null

  return value ?? null
}

function collectModifierOptionIds(product: ProductConfigWithModifierGroups) {
  return [
    ...new Set(
      (product.product_modifier_groups ?? []).flatMap((assignment) => {
        const group = firstRelation(assignment.modifier_groups)

        return (group?.modifier_options ?? []).map((option) => option.id)
      })
    ),
  ]
}

function applyModifierOptionOperationalAvailability<
  TProduct extends ProductConfigWithModifierGroups,
>({
  product,
  modifierOptionRecords,
  currentTime,
}: {
  product: TProduct
  modifierOptionRecords: Map<string, OperationalAvailabilityOverride[]>
  currentTime: Date
}) {
  return {
    ...product,
    product_modifier_groups: (product.product_modifier_groups ?? []).map(
      (assignment) => {
        const group = firstRelation(assignment.modifier_groups)

        if (!group) return assignment

        return {
          ...assignment,
          modifier_groups: {
            ...group,
            modifier_options: (group.modifier_options ?? []).map((option) => {
              const availability = resolveOperationalAvailabilityForRecords({
                isPermanentlyEnabled: option.is_enabled,
                records: modifierOptionRecords.get(option.id),
                currentTime,
              })

              return {
                ...option,
                is_enabled: availability.isOperationallyAvailable,
              }
            }),
          },
        }
      }
    ),
  }
}

export async function getProductConfig(
  productId: string,
  options: ProductConfigQueryOptions = {}
) {
  const currentTime = new Date()
  const businessId = options.businessSlug
    ? await resolveBusinessIdFromSlug(options.businessSlug)
    : null

  let query = supabase
    .from("products")
    .select(`
      id,
      business_id,
      name,
      description,
      builder_template,
      has_variants,
      is_enabled,
      base_price,
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
      product_variant_modifier_option_availability_rules (
        product_id,
        variant_group_option_id,
        modifier_group_id,
        modifier_option_id,
        is_available,
        is_enabled
      ),
      product_variant_modifier_option_price_overrides (
        variant_group_option_id,
        modifier_group_id,
        modifier_option_id,
        price_delta,
        is_enabled
      ),
      product_modifier_option_overrides (
        modifier_option_id,
        price_delta_override,
        prep_time_delta_minutes_override,
        is_enabled,
        sort_order
      ),
      product_modifier_groups (
        id,
        is_enabled,
        sort_order,
        modifier_groups (
          id,
          name,
          selection_type,
          is_required,
          min_required,
          max_allowed,
          is_enabled,
          supports_placement,
          supports_multiplier,
          min_multiplier,
          max_multiplier,
          multiplier_step,
          modifier_options (
            id,
            name,
            price_delta,
            is_enabled,
            sort_order,
            modifier_option_group_id,
            modifier_option_groups (
              id,
              name,
              description,
              is_enabled,
              sort_order
            )
          )
        )
      ),
      product_included_modifier_groups (
        id,
        modifier_group_id,
        included_quantity,
        is_swappable,
        charge_for_extra
      ),
      product_default_modifier_options (
        id,
        modifier_group_id,
        modifier_option_id,
        placement,
        multiplier,
        quantity,
        is_enabled,
        sort_order
      )
    `)
    .eq("id", productId)
    .eq("is_enabled", true)

  if (businessId) {
    query = query.eq("business_id", businessId)
  }

  const { data, error } = await query.single()

  if (error) {
    throw new Error(`Failed to load product config: ${error.message}`)
  }

  const resolvedBusinessId = (data.business_id as string | null) ?? businessId
  const typedProduct = data as ProductConfigWithModifierGroups & {
    business_id?: string | null
  }

  if (resolvedBusinessId) {
    const { data: productAvailability, error: productAvailabilityError } =
      await supabase
        .from("product_operational_availability")
        .select("id, product_id, location_id, is_86d, reason, expires_at")
        .eq("business_id", resolvedBusinessId)
        .eq("product_id", productId)

    if (productAvailabilityError) {
      throw new Error(
        `Failed to load product availability: ${productAvailabilityError.message}`
      )
    }

    const productAvailabilityRecords = groupProductOperationalAvailabilityRecords(
      productAvailability as RawOperationalAvailabilityRecord[]
    )
    const productAvailabilityResolution =
      resolveOperationalAvailabilityForRecords({
        isPermanentlyEnabled: typedProduct.is_enabled,
        records: productAvailabilityRecords.get(productId),
        currentTime,
      })

    if (!productAvailabilityResolution.isOperationallyAvailable) {
      throw new Error(`${typedProduct.name ?? "This item"} is currently sold out.`)
    }
  }

  const modifierOptionIds = collectModifierOptionIds(typedProduct)
  const { data: modifierAvailability, error: modifierAvailabilityError } =
    resolvedBusinessId && modifierOptionIds.length > 0
      ? await supabase
          .from("modifier_option_operational_availability")
          .select(
            "id, modifier_option_id, location_id, is_86d, reason, expires_at"
          )
          .eq("business_id", resolvedBusinessId)
          .in("modifier_option_id", modifierOptionIds)
      : { data: [], error: null }

  if (modifierAvailabilityError) {
    throw new Error(
      `Failed to load modifier availability: ${modifierAvailabilityError.message}`
    )
  }

  const modifierOptionRecords =
    groupModifierOptionOperationalAvailabilityRecords(
      modifierAvailability as RawOperationalAvailabilityRecord[]
    )
  const pricingSettings = resolvedBusinessId
    ? await getPricingSettings(resolvedBusinessId)
    : normalizeBusinessPricingSettings(null)
  const productWithEffectiveConfig = applyEffectiveModifierGroups(
    applyEffectiveVariants(
      typedProduct as unknown as ProductWithVariantSources &
        ProductModifierOverrideSources
    )
  )
  const productWithOperationalAvailability =
    applyModifierOptionOperationalAvailability({
      product:
        productWithEffectiveConfig as unknown as ProductConfigWithModifierGroups,
      modifierOptionRecords,
      currentTime,
    })

  return {
    ...productWithOperationalAvailability,
    pricing_settings: pricingSettings,
  }
}

async function getPricingSettings(businessId: string) {
  const { data, error } = await supabase
    .from("business_pricing_settings")
    .select(
      `
      pizza_half_topping_pricing_enabled,
      pizza_half_topping_included_weight_enabled,
      pizza_half_topping_rounding_mode
    `
    )
    .eq("business_id", businessId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load pricing settings: ${error.message}`)
  }

  return normalizeBusinessPricingSettings(data as RawBusinessPricingSettings | null)
}
