import type {
  SpecialAvailabilityWindow,
  SpecialDiscountType,
  SpecialType,
} from "@/features/specials/types/special"

export type PublicSpecialProductEligibility = {
  productId: string
  variantGroupOptionId?: string | null
}

export type PublicSpecial = {
  id: string
  businessId: string
  name: string
  customerDescription: string | null
  specialType: SpecialType
  discountType: SpecialDiscountType
  discountValue: number
  minOrderAmount: number | null
  startsAt: string | null
  endsAt: string | null
  eligibleProducts: PublicSpecialProductEligibility[]
  eligibleMenuGroupIds: string[]
  availabilityWindows: SpecialAvailabilityWindow[]
}
