import type { ProductConfig } from "@/features/product-configurator/components/ProductConfigurator"
import type { SpecialAvailabilityWindow } from "@/features/specials/types/special"

export type PublicOrderableDealProduct = {
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

export type PublicOrderableDealComponent = {
  id: string
  label: string
  description: string | null
  sortOrder: number
  requiredQuantity: number
  minQuantity: number
  maxQuantity: number
  pricingBehavior: "included_base"
  isRequired: boolean
  products: PublicOrderableDealProduct[]
}

export type PublicOrderableDeal = {
  id: string
  businessId: string
  businessSlug?: string | null
  name: string
  customerDescription: string | null
  dealBasePrice: number
  isEnabled: boolean
  startsAt: string | null
  endsAt: string | null
  availabilityWindows: SpecialAvailabilityWindow[]
  components: PublicOrderableDealComponent[]
}

export type DealBuilderProductConfig = ProductConfig
