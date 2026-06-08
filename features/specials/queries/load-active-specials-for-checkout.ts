import { supabaseAdmin } from "@/lib/supabase/admin"
import type { SpecialCandidate } from "@/features/specials/types/special"
import { isSpecialCurrentlyEligible } from "@/features/specials/utils/special-schedule"

type RawSpecialProduct = {
  product_id: string
  variant_group_option_id: string | null
}

type RawSpecialMenuGroup = {
  menu_group_id: string
}

type RawSpecialAvailabilityWindow = {
  id: string
  day_of_week: number
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
}

type RawCheckoutSpecial = {
  id: string
  business_id: string
  name: string
  special_type: SpecialCandidate["specialType"]
  discount_type: SpecialCandidate["discountType"]
  discount_value: number | string
  min_order_amount: number | string | null
  starts_at: string | null
  ends_at: string | null
  is_enabled: boolean
  special_products: RawSpecialProduct[] | null
  special_menu_groups: RawSpecialMenuGroup[] | null
  special_availability_windows: RawSpecialAvailabilityWindow[] | null
}

export type LoadActiveSpecialsForCheckoutInput = {
  businessId: string
  currentTime: Date
  timeZone?: string | null
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0

  return typeof value === "number" ? value : Number(value)
}

export async function loadActiveSpecialsForCheckout({
  businessId,
  currentTime,
  timeZone,
}: LoadActiveSpecialsForCheckoutInput): Promise<SpecialCandidate[]> {
  const timestamp = currentTime.toISOString()
  const { data, error } = await supabaseAdmin
    .from("specials")
    .select(
      `
      id,
      business_id,
      name,
      special_type,
      discount_type,
      discount_value,
      min_order_amount,
      starts_at,
      ends_at,
      is_enabled,
      special_products (
        product_id,
        variant_group_option_id
      ),
      special_menu_groups (
        menu_group_id
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
    .eq("business_id", businessId)
    .eq("is_enabled", true)
    .or(`starts_at.is.null,starts_at.lte.${timestamp}`)
    .or(`ends_at.is.null,ends_at.gte.${timestamp}`)

  if (error) {
    throw new Error(`Could not load checkout specials: ${error.message}`)
  }

  return ((data ?? []) as RawCheckoutSpecial[])
    .map((special) => ({
      id: special.id,
      businessId: special.business_id,
      name: special.name,
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
      eligibleProducts: (special.special_products ?? []).map((product) => ({
        productId: product.product_id,
        variantGroupOptionId: product.variant_group_option_id,
      })),
      eligibleMenuGroupIds: (special.special_menu_groups ?? []).map(
        (menuGroup) => menuGroup.menu_group_id
      ),
      availabilityWindows: (
        special.special_availability_windows ?? []
      ).map((window) => ({
        id: window.id,
        dayOfWeek: window.day_of_week,
        startTime: window.start_time,
        endTime: window.end_time,
        isAllDay: window.is_all_day,
      })),
    }))
    .filter((special) =>
      isSpecialCurrentlyEligible({
        isEnabled: special.isEnabled,
        startsAt: special.startsAt,
        endsAt: special.endsAt,
        availabilityWindows: special.availabilityWindows,
        currentTime,
        timeZone,
      })
    )
}
