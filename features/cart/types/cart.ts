export type CartModifier = {
  optionId: string
  optionName: string
  groupId: string
  groupName: string
  placement: "left" | "whole" | "right"
  multiplier: number
  priceDelta: number
}

export type ConfiguredProductResult = {
  businessId?: string | null
  businessSlug?: string | null
  locationId?: string | null
  locationSlug?: string | null
  productId: string
  productName: string
  variantId: string | null
  variantName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  configuredLineTotal?: number
  chargedModifierTotal?: number
  modifierExtraTotal?: number
  childExtraTotal?: number
  modifiers: CartModifier[]
}

export type ConfiguredCartItem = ConfiguredProductResult & {
  cartItemId: string
  itemType?: "configured"
}

export type DealCartChildItem = {
  childLineId: string
  productId: string
  productName: string
  variantId: string | null
  variantName: string | null
  quantity: number
  configuredLineTotal: number | null
  componentPricingMode?: "included" | "fixed_price" | "normal_price"
  componentFixedPrice?: number | null
  componentBasePrice?: number
  childExtraTotal: number
  modifiers: CartModifier[]
}

export type DealCartComponent = {
  componentId: string
  componentLabel: string
  sortOrder: number
  requiredQuantity: number
  selectedQuantity: number
  pricingMode?: "included" | "fixed_price" | "normal_price"
  fixedPrice?: number | null
  componentBaseTotal?: number
  children: DealCartChildItem[]
}

export type DealCartItem = {
  cartItemId: string
  itemType: "deal"
  specialType?: "orderable_deal" | "mix_and_match_fixed_unit_price"
  businessId?: string | null
  businessSlug?: string | null
  locationId?: string | null
  locationSlug?: string | null
  specialId: string
  specialName: string
  ruleSummary?: string | null
  selectedQuantity?: number | null
  unitPrice?: number | null
  mixBaseTotal?: number | null
  usesComponentPricing?: boolean
  componentBaseTotal?: number | null
  dealBasePrice: number
  childExtraTotal: number
  totalPrice: number
  components: DealCartComponent[]
}

export type CartItem = ConfiguredCartItem | DealCartItem
