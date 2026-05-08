export type CartModifier = {
  optionId: string
  optionName: string
  groupId: string
  groupName: string
  placement: "left" | "whole" | "right"
  multiplier: number
  priceDelta: number
}

export type CartItem = {
  cartItemId: string
  productId: string
  productName: string
  variantId: string | null
  variantName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  modifiers: CartModifier[]
}