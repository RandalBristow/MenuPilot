import type { ProductConfig } from "@/features/product-configurator/components/ProductConfigurator"
import type { SpecialAvailabilityWindow } from "@/features/specials/types/special"

export type PublicMixAndMatchProduct = {
  id: string
  name: string
  description: string | null
  basePrice: number | null
  builderTemplate: string | null
  hasVariants: boolean
  imageMediaId?: string | null
  mediaAsset?: {
    id: string
    publicUrl: string | null
    altText: string | null
    caption: string | null
    isArchived: boolean
  } | null
  allowedVariantOptionIds: string[]
  modifierGroupOverrides: Array<{
    modifierGroupId: string
    includedSelectionCount: number
  }>
}

export type PublicMixAndMatchDeal = {
  id: string
  businessId: string
  businessSlug?: string | null
  name: string
  customerDescription: string | null
  isEnabled: boolean
  startsAt: string | null
  endsAt: string | null
  availabilityWindows: SpecialAvailabilityWindow[]
  rule: {
    minQuantity: number
    maxQuantity: number | null
    unitPrice: number
    allowExtraItems: boolean
  }
  products: PublicMixAndMatchProduct[]
}

export type MixAndMatchBuilderProductConfig = ProductConfig
