import { supabaseAdmin } from "@/lib/supabase/admin"
import type {
  StaffOrder,
  StaffOrderItem,
} from "@/features/staff-orders/types/staff-order"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import { resolveLocationContext } from "@/features/tenant/queries/resolve-location-context"
import type {
  TenantBusinessContext,
  TenantLocationContext,
} from "@/features/tenant/types/tenant-context"

export const LEGACY_STAFF_BUSINESS_SLUG = "pronto-demo"
export const LEGACY_STAFF_LOCATION_SLUG = "main-street"

export type StaffOrderTenantInput = {
  businessSlug?: string | null
  locationSlug?: string | null
}

export type StaffOrderScope = {
  business: TenantBusinessContext
  location: TenantLocationContext
  isLegacyDemo: boolean
}

type RawOrderModifier = {
  id: string
  group_name_snapshot: string
  option_name_snapshot: string
  placement: string
  multiplier: number | string
  price_delta: number | string
  quantity: number | string
}

type RawOrderItem = {
  id: string
  parent_order_item_id: string | null
  relationship_type: string | null
  product_name_snapshot: string
  variant_name_snapshot: string | null
  quantity: number
  unit_price: number | string
  line_subtotal: number | string
  notes: string | null
  sort_order: number
  order_item_modifiers: RawOrderModifier[] | null
}

type RawOrderDiscount = {
  id: string
  order_id: string
  order_item_id: string | null
  special_id: string | null
  name_snapshot: string
  special_type_snapshot: string
  discount_type_snapshot: string
  discount_value_snapshot: number | string
  amount: number | string
  coupon_code_snapshot: string | null
  created_at: string
}

type RawOrder = {
  id: string
  order_number: string
  customer_name: string | null
  customer_phone: string | null
  fulfillment_type: string
  order_status: string
  payment_status: string
  subtotal: number | string
  discount_total: number | string
  total: number | string
  created_at: string
  order_items: RawOrderItem[] | null
  order_discounts: RawOrderDiscount[] | null
}

function toNumber(value: number | string) {
  return Number(value)
}

function parseOrderItemNotes(value: string | null) {
  if (!value) return {}

  try {
    const parsed = JSON.parse(value)

    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>
    }
  } catch {
    return {}
  }

  return {}
}

function getStringMetadata(
  notes: Record<string, unknown>,
  key: string
) {
  const value = notes[key]

  return typeof value === "string" ? value : null
}

function getNumberMetadata(
  notes: Record<string, unknown>,
  key: string
) {
  const value = notes[key]

  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function mapOrder(order: RawOrder): StaffOrder {
  const items = [...(order.order_items ?? [])].sort(
    (first, second) => first.sort_order - second.sort_order
  )
  const discounts = (order.order_discounts ?? []).map((discount) => ({
    id: discount.id,
    orderId: discount.order_id,
    orderItemId: discount.order_item_id,
    specialId: discount.special_id,
    nameSnapshot: discount.name_snapshot,
    specialTypeSnapshot: discount.special_type_snapshot,
    discountTypeSnapshot: discount.discount_type_snapshot,
    discountValueSnapshot: toNumber(discount.discount_value_snapshot),
    amount: toNumber(discount.amount),
    couponCodeSnapshot: discount.coupon_code_snapshot,
    createdAt: discount.created_at,
  }))

  const mappedItems: StaffOrderItem[] = items.map((item) => {
    const notes = parseOrderItemNotes(item.notes)

    return {
      id: item.id,
      parentOrderItemId: item.parent_order_item_id,
      relationshipType: item.relationship_type,
      specialType: getStringMetadata(notes, "specialType"),
      componentLabel: getStringMetadata(notes, "componentLabel"),
      componentPricingMode: getStringMetadata(notes, "componentPricingMode"),
      componentFixedPrice: getNumberMetadata(notes, "componentFixedPrice"),
      componentBasePrice: getNumberMetadata(notes, "componentBasePrice"),
      childExtraTotal: getNumberMetadata(notes, "childExtraTotal"),
      productName: item.product_name_snapshot,
      variantName: item.variant_name_snapshot,
      quantity: item.quantity,
      unitPrice: toNumber(item.unit_price),
      lineSubtotal: toNumber(item.line_subtotal),
      discounts: discounts.filter((discount) => discount.orderItemId === item.id),
      modifiers: (item.order_item_modifiers ?? []).map((modifier) => ({
        id: modifier.id,
        groupName: modifier.group_name_snapshot,
        optionName: modifier.option_name_snapshot,
        placement: modifier.placement,
        multiplier: toNumber(modifier.multiplier),
        priceDelta: toNumber(modifier.price_delta),
        quantity: toNumber(modifier.quantity),
      })),
      children: [],
    }
  })
  const mappedItemsById = new Map(
    mappedItems.map((item) => [item.id, item])
  )

  for (const item of mappedItems) {
    if (!item.parentOrderItemId) continue

    const parent = mappedItemsById.get(item.parentOrderItemId)
    if (parent) parent.children.push(item)
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    fulfillmentType: order.fulfillment_type,
    orderStatus: order.order_status,
    paymentStatus: order.payment_status,
    subtotal: toNumber(order.subtotal),
    discountTotal: toNumber(order.discount_total),
    total: toNumber(order.total),
    createdAt: order.created_at,
    items: mappedItems.filter((item) => item.parentOrderItemId == null),
    discounts,
    orderLevelDiscounts: discounts.filter(
      (discount) => discount.orderItemId === null
    ),
  }
}

function getEffectiveStaffOrderSlugs(input: StaffOrderTenantInput = {}) {
  const businessSlug = input.businessSlug?.trim() || LEGACY_STAFF_BUSINESS_SLUG
  const locationSlug = input.locationSlug?.trim() || LEGACY_STAFF_LOCATION_SLUG

  return {
    businessSlug,
    locationSlug,
    isLegacyDemo:
      !input.businessSlug?.trim() && !input.locationSlug?.trim(),
  }
}

export async function getStaffOrderScope(
  input: StaffOrderTenantInput = {}
): Promise<StaffOrderScope | null> {
  const { businessSlug, locationSlug, isLegacyDemo } =
    getEffectiveStaffOrderSlugs(input)
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) return null

  const location = await resolveLocationContext({
    businessId: business.id,
    locationSlug,
  })

  if (!location) return null

  return { business, location, isLegacyDemo }
}

export async function getRecentStaffOrdersForScope({
  businessId,
  locationId,
}: {
  businessId: string
  locationId: string
}) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      id,
      order_number,
      customer_name,
      customer_phone,
      fulfillment_type,
      order_status,
      payment_status,
      subtotal,
      discount_total,
      total,
      created_at,
      order_discounts (
        id,
        order_id,
        order_item_id,
        special_id,
        name_snapshot,
        special_type_snapshot,
        discount_type_snapshot,
        discount_value_snapshot,
        amount,
        coupon_code_snapshot,
        created_at
      ),
      order_items (
        id,
        parent_order_item_id,
        relationship_type,
        product_name_snapshot,
        variant_name_snapshot,
        quantity,
        unit_price,
        line_subtotal,
        notes,
        sort_order,
        order_item_modifiers (
          id,
          group_name_snapshot,
          option_name_snapshot,
          placement,
          multiplier,
          price_delta,
          quantity
        )
      )
    `
    )
    .eq("business_id", businessId)
    .eq("location_id", locationId)
    .order("created_at", { ascending: false })
    .limit(25)

  if (error) {
    throw new Error(`Could not load staff orders: ${error.message}`)
  }

  return ((data ?? []) as RawOrder[]).map(mapOrder)
}

export async function getRecentStaffOrders(input: StaffOrderTenantInput = {}) {
  const scope = await getStaffOrderScope(input)

  if (!scope) {
    throw new Error("Could not load staff order location.")
  }

  return getRecentStaffOrdersForScope({
    businessId: scope.business.id,
    locationId: scope.location.id,
  })
}
