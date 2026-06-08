export const SPECIAL_TYPES = [
  "line_discount",
  "fixed_price_line",
  "cart_discount",
  "orderable_deal",
  "mix_and_match_fixed_unit_price",
] as const

export type SpecialType = (typeof SPECIAL_TYPES)[number]

export const SPECIAL_DISCOUNT_TYPES = [
  "percentage",
  "fixed_amount",
  "fixed_price",
] as const

export type SpecialDiscountType = (typeof SPECIAL_DISCOUNT_TYPES)[number]

export type SpecialProductEligibility = {
  productId: string
  variantGroupOptionId?: string | null
}

export type SpecialMixMatchRule = {
  id?: string
  specialId: string
  minQuantity: number
  maxQuantity?: number | null
  unitPrice: number
  allowExtraItems: boolean
}

export type SpecialMixMatchProductEligibility = {
  id?: string
  specialId: string
  productId: string
  sortOrder: number
  allowedVariantOptionIds?: string[]
  modifierGroupOverrides?: Array<{
    modifierGroupId: string
    includedSelectionCount: number
  }>
}

export type SpecialAvailabilityWindow = {
  id?: string
  dayOfWeek: number
  startTime?: string | null
  endTime?: string | null
  isAllDay: boolean
}

export type SpecialCandidate = {
  id: string
  businessId: string
  name: string
  specialType: SpecialType
  discountType: SpecialDiscountType
  discountValue: number
  minOrderAmount?: number | null
  startsAt?: string | Date | null
  endsAt?: string | Date | null
  isEnabled: boolean
  eligibleProducts?: SpecialProductEligibility[] | null
  eligibleMenuGroupIds?: string[] | null
  availabilityWindows?: SpecialAvailabilityWindow[] | null
}
