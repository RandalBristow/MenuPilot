import { supabaseAdmin } from "@/lib/supabase/admin"
import type {
  CustomerOrderStatus,
  CustomerOrderStatusDiscount,
  CustomerOrderStatusItem,
  CustomerOrderStatusModifier,
} from "@/features/order-status/types/customer-order"

type RawOrderModifier = {
  group_name_snapshot: string
  option_name_snapshot: string
  placement: string
  multiplier: number | string
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
  order_item_id: string | null
  name_snapshot: string
  discount_type_snapshot: string
  discount_value_snapshot: number | string
  amount: number | string
}

type RawOrder = {
  order_number: string
  customer_name: string | null
  fulfillment_type: string
  order_status: string
  subtotal: number | string
  discount_total: number | string
  tax_total: number | string
  tip_total: number | string
  charge_total: number | string
  total: number | string
  estimated_prep_minutes: number | null
  estimated_ready_at: string | null
  created_at: string
  businesses:
    | {
        name: string
        slug: string
      }
    | {
        name: string
        slug: string
      }[]
    | null
  locations:
    | {
        name: string
        address_line1: string | null
        address_line2: string | null
        city: string | null
        state: string | null
        postal_code: string | null
        phone: string | null
        timezone: string
      }
    | {
        name: string
        address_line1: string | null
        address_line2: string | null
        city: string | null
        state: string | null
        postal_code: string | null
        phone: string | null
        timezone: string
      }[]
    | null
  order_items: RawOrderItem[] | null
  order_discounts: RawOrderDiscount[] | null
}

function toNumber(value: number | string) {
  return Number(value)
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null

  return value ?? null
}

function parseOrderItemNotes(value: string | null) {
  if (!value) return {}

  try {
    const parsed = JSON.parse(value)

    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>
    }
  } catch {
    return {}
  }

  return {}
}

function getStringMetadata(notes: Record<string, unknown>, key: string) {
  const value = notes[key]

  return typeof value === "string" ? value : null
}

function getNumberMetadata(notes: Record<string, unknown>, key: string) {
  const value = notes[key]

  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function mapDiscount(discount: RawOrderDiscount): CustomerOrderStatusDiscount {
  return {
    name: discount.name_snapshot,
    discountType: discount.discount_type_snapshot,
    discountValue: toNumber(discount.discount_value_snapshot),
    amount: toNumber(discount.amount),
  }
}

function mapModifier(
  modifier: RawOrderModifier
): CustomerOrderStatusModifier {
  return {
    groupName: modifier.group_name_snapshot,
    optionName: modifier.option_name_snapshot,
    placement: modifier.placement,
    multiplier: toNumber(modifier.multiplier),
    quantity: toNumber(modifier.quantity),
  }
}

function mapOrder(order: RawOrder): CustomerOrderStatus | null {
  const business = firstRelation(order.businesses)
  const location = firstRelation(order.locations)

  if (!business || !location) return null

  const discountRows = order.order_discounts ?? []
  const sortedItems = [...(order.order_items ?? [])].sort(
    (first, second) => first.sort_order - second.sort_order
  )
  const mappedItems = sortedItems.map((item) => {
    const notes = parseOrderItemNotes(item.notes)
    const mappedItem: CustomerOrderStatusItem = {
      productName: item.product_name_snapshot,
      variantName: item.variant_name_snapshot,
      quantity: item.quantity,
      unitPrice: toNumber(item.unit_price),
      lineSubtotal: toNumber(item.line_subtotal),
      relationshipType: item.relationship_type,
      specialType: getStringMetadata(notes, "specialType"),
      componentLabel: getStringMetadata(notes, "componentLabel"),
      componentPricingMode: getStringMetadata(notes, "componentPricingMode"),
      componentBasePrice: getNumberMetadata(notes, "componentBasePrice"),
      modifiers: (item.order_item_modifiers ?? []).map(mapModifier),
      discounts: discountRows
        .filter((discount) => discount.order_item_id === item.id)
        .map(mapDiscount),
      children: [],
    }

    return {
      sourceId: item.id,
      sourceParentId: item.parent_order_item_id,
      item: mappedItem,
    }
  })
  const byId = new Map(mappedItems.map((entry) => [entry.sourceId, entry.item]))

  for (const entry of mappedItems) {
    if (!entry.sourceParentId) continue

    const parent = byId.get(entry.sourceParentId)
    if (parent) parent.children.push(entry.item)
  }

  return {
    orderNumber: order.order_number,
    businessName: business.name,
    businessSlug: business.slug,
    locationName: location.name,
    locationAddress: {
      line1: location.address_line1,
      line2: location.address_line2,
      city: location.city,
      state: location.state,
      postalCode: location.postal_code,
      phone: location.phone,
      timezone: location.timezone,
    },
    customerName: order.customer_name,
    fulfillmentType: order.fulfillment_type,
    orderStatus: order.order_status,
    placedAt: order.created_at,
    estimatedPrepMinutes: order.estimated_prep_minutes,
    estimatedReadyAt: order.estimated_ready_at,
    subtotal: toNumber(order.subtotal),
    discountTotal: toNumber(order.discount_total),
    serviceFeeTotal: toNumber(order.charge_total),
    taxTotal: toNumber(order.tax_total),
    tipTotal: toNumber(order.tip_total),
    total: toNumber(order.total),
    items: mappedItems
      .filter((entry) => entry.sourceParentId === null)
      .map((entry) => entry.item),
    orderLevelDiscounts: discountRows
      .filter((discount) => discount.order_item_id === null)
      .map(mapDiscount),
  }
}

export async function getCustomerOrderStatus({
  businessSlug,
  orderNumber,
}: {
  businessSlug: string
  orderNumber: string
}) {
  const normalizedOrderNumber = orderNumber.trim()

  if (!businessSlug.trim() || !normalizedOrderNumber) return null

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      order_number,
      customer_name,
      fulfillment_type,
      order_status,
      subtotal,
      discount_total,
      tax_total,
      tip_total,
      charge_total,
      total,
      estimated_prep_minutes,
      estimated_ready_at,
      created_at,
      businesses!inner (
        name,
        slug
      ),
      locations (
        name,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        phone,
        timezone
      ),
      order_discounts (
        order_item_id,
        name_snapshot,
        discount_type_snapshot,
        discount_value_snapshot,
        amount
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
          group_name_snapshot,
          option_name_snapshot,
          placement,
          multiplier,
          quantity
        )
      )
    `
    )
    .eq("businesses.slug", businessSlug)
    .eq("order_number", normalizedOrderNumber)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load order status: ${error.message}`)
  }

  if (!data) return null

  return mapOrder(data as RawOrder)
}
