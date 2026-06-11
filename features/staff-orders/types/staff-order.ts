export type StaffOrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "canceled"
  | "cancelled"

export type StaffOrderActionStatus =
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "canceled"

export const staffOrderActionLabels = {
  accepted: "Accept",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Complete",
  canceled: "Cancel",
} satisfies Record<StaffOrderActionStatus, string>

export const staffOrderTransitions: Record<
  StaffOrderStatus,
  StaffOrderActionStatus[]
> = {
  new: ["accepted", "canceled"],
  accepted: ["preparing", "canceled"],
  preparing: ["ready", "canceled"],
  ready: ["completed", "canceled"],
  completed: [],
  canceled: [],
  cancelled: [],
}

export function isStaffOrderActionStatus(
  status: string
): status is StaffOrderActionStatus {
  return status in staffOrderActionLabels
}

export function getAllowedNextStaffOrderStatuses(status: string) {
  if (status in staffOrderTransitions) {
    return staffOrderTransitions[status as StaffOrderStatus]
  }

  return []
}

export function canTransitionStaffOrderStatus(
  currentStatus: string,
  nextStatus: StaffOrderActionStatus
) {
  return getAllowedNextStaffOrderStatuses(currentStatus).includes(nextStatus)
}

export type StaffOrderModifier = {
  id: string
  groupName: string
  optionName: string
  placement: string
  multiplier: number
  priceDelta: number
  quantity: number
}

export type StaffOrderItem = {
  id: string
  parentOrderItemId: string | null
  relationshipType: string | null
  specialType: string | null
  componentLabel: string | null
  componentPricingMode: string | null
  componentFixedPrice: number | null
  componentBasePrice: number | null
  childExtraTotal: number | null
  productName: string
  variantName: string | null
  quantity: number
  unitPrice: number
  lineSubtotal: number
  modifiers: StaffOrderModifier[]
  discounts: StaffOrderDiscount[]
  children: StaffOrderItem[]
}

export type StaffOrderDiscount = {
  id: string
  orderId: string
  orderItemId: string | null
  specialId: string | null
  nameSnapshot: string
  specialTypeSnapshot: string
  discountTypeSnapshot: string
  discountValueSnapshot: number
  amount: number
  couponCodeSnapshot: string | null
  createdAt: string
}

export type StaffOrder = {
  id: string
  orderNumber: string
  customerName: string | null
  customerPhone: string | null
  fulfillmentType: string
  orderStatus: StaffOrderStatus | string
  paymentStatus: string
  subtotal: number
  discountTotal: number
  serviceFeeTotal: number
  taxTotal: number
  tipTotal: number
  total: number
  createdAt: string
  items: StaffOrderItem[]
  discounts: StaffOrderDiscount[]
  orderLevelDiscounts: StaffOrderDiscount[]
}
