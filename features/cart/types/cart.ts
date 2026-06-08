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
  childExtraTotal: number
  modifiers: CartModifier[]
}

export type DealCartComponent = {
  componentId: string
  componentLabel: string
  sortOrder: number
  requiredQuantity: number
  selectedQuantity: number
  children: DealCartChildItem[]
}

export type DealCartItem = {
  cartItemId: string
  itemType: "deal"
  businessId?: string | null
  businessSlug?: string | null
  locationId?: string | null
  locationSlug?: string | null
  specialId: string
  specialName: string
  dealBasePrice: number
  childExtraTotal: number
  totalPrice: number
  components: DealCartComponent[]
}

export type CartItem = ConfiguredCartItem | DealCartItem
