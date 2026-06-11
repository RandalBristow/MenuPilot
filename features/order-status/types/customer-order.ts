export type CustomerOrderStatusModifier = {
  groupName: string
  optionName: string
  placement: string
  multiplier: number
  quantity: number
}

export type CustomerOrderStatusDiscount = {
  name: string
  discountType: string
  discountValue: number
  amount: number
}

export type CustomerOrderStatusItem = {
  productName: string
  variantName: string | null
  quantity: number
  unitPrice: number
  lineSubtotal: number
  relationshipType: string | null
  specialType: string | null
  componentLabel: string | null
  componentPricingMode: string | null
  componentBasePrice: number | null
  modifiers: CustomerOrderStatusModifier[]
  discounts: CustomerOrderStatusDiscount[]
  children: CustomerOrderStatusItem[]
}

export type CustomerOrderStatus = {
  orderNumber: string
  businessName: string
  businessSlug: string
  locationName: string
  locationAddress: {
    line1: string | null
    line2: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    phone: string | null
    timezone: string
  }
  customerName: string | null
  fulfillmentType: string
  orderStatus: string
  placedAt: string
  estimatedPrepMinutes: number | null
  estimatedReadyAt: string | null
  subtotal: number
  discountTotal: number
  serviceFeeTotal: number
  taxTotal: number
  tipTotal: number
  total: number
  items: CustomerOrderStatusItem[]
  orderLevelDiscounts: CustomerOrderStatusDiscount[]
}
