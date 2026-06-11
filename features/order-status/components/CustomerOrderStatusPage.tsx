import Link from "next/link"
import { RefreshCw } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import type {
  CustomerOrderStatus,
  CustomerOrderStatusDiscount,
  CustomerOrderStatusItem,
  CustomerOrderStatusModifier,
} from "@/features/order-status/types/customer-order"
import {
  getCustomerOrderStatusDescription,
  getCustomerOrderStatusLabel,
} from "@/features/order-status/utils/customer-order-status-labels"

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

function formatDateTime(value: string, timeZone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value))
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ")
}

function formatModifierDetail(modifier: CustomerOrderStatusModifier) {
  const details = []

  if (modifier.placement !== "whole") {
    details.push(modifier.placement)
  }

  if (modifier.multiplier > 1) {
    details.push(`x${modifier.multiplier}`)
  }

  if (modifier.quantity > 1) {
    details.push(`qty ${modifier.quantity}`)
  }

  return details.length > 0 ? ` (${details.join(", ")})` : ""
}

function formatComponentPricing(item: CustomerOrderStatusItem) {
  if (item.componentPricingMode === "fixed_price") {
    return `Fixed price ${formatMoney(item.componentBasePrice ?? 0)}`
  }

  if (item.componentPricingMode === "included") {
    return "Included"
  }

  return null
}

function getSpecialTypeLabel(item: CustomerOrderStatusItem) {
  if (item.specialType === "orderable_deal") return "Deal"
  if (item.specialType === "mix_and_match_fixed_unit_price") return "Mix & Match"

  return null
}

function formatDiscountValue(discount: CustomerOrderStatusDiscount) {
  if (discount.discountType === "percentage") {
    return `${discount.discountValue}% off`
  }

  if (discount.discountType === "fixed_price") {
    return `${formatMoney(discount.discountValue)} fixed price`
  }

  return `${formatMoney(discount.discountValue)} off`
}

function LocationAddress({ order }: { order: CustomerOrderStatus }) {
  const { locationAddress } = order
  const cityState = [
    locationAddress.city,
    locationAddress.state,
    locationAddress.postalCode,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{order.locationName}</p>
      {locationAddress.line1 ? <p>{locationAddress.line1}</p> : null}
      {locationAddress.line2 ? <p>{locationAddress.line2}</p> : null}
      {cityState ? <p>{cityState}</p> : null}
      {locationAddress.phone ? <p>{locationAddress.phone}</p> : null}
    </div>
  )
}

function ModifierRows({
  modifiers,
}: {
  modifiers: CustomerOrderStatusModifier[]
}) {
  if (modifiers.length === 0) return null

  return (
    <div className="mt-3 space-y-1 border-l pl-3 text-sm text-muted-foreground">
      {modifiers.map((modifier, index) => (
        <p key={`${modifier.groupName}-${modifier.optionName}-${index}`}>
          <span className="font-medium text-foreground">
            {modifier.groupName}:
          </span>{" "}
          {modifier.optionName}
          {formatModifierDetail(modifier)}
        </p>
      ))}
    </div>
  )
}

function DiscountRows({
  discounts,
}: {
  discounts: CustomerOrderStatusDiscount[]
}) {
  if (discounts.length === 0) return null

  return (
    <div className="mt-3 space-y-1 border-l border-success/30 pl-3 text-sm">
      {discounts.map((discount, index) => (
        <div
          key={`${discount.name}-${index}`}
          className="flex items-start justify-between gap-3 text-success"
        >
          <span>
            {discount.name} {formatDiscountValue(discount)}
          </span>
          <span className="shrink-0 font-medium">
            -{formatMoney(discount.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

function OrderItem({
  item,
  isChild = false,
}: {
  item: CustomerOrderStatusItem
  isChild?: boolean
}) {
  const componentPricing = formatComponentPricing(item)
  const specialTypeLabel = getSpecialTypeLabel(item)

  return (
    <div
      className={
        isChild ? "rounded-md border bg-muted/20 p-3" : "rounded-lg border p-4"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          {item.componentLabel ? (
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {item.componentLabel}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{item.productName}</p>
            {specialTypeLabel ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {specialTypeLabel}
              </span>
            ) : null}
          </div>
          {item.variantName ? (
            <p className="text-sm text-muted-foreground">{item.variantName}</p>
          ) : null}
          {componentPricing ? (
            <p className="text-sm text-muted-foreground">{componentPricing}</p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-medium">Qty {item.quantity}</p>
          <p className="text-sm text-muted-foreground">
            {formatMoney(item.lineSubtotal)}
          </p>
        </div>
      </div>

      <ModifierRows modifiers={item.modifiers} />
      <DiscountRows discounts={item.discounts} />

      {item.children.length > 0 ? (
        <div className="mt-3 space-y-2 border-l pl-3">
          {item.children.map((child, index) => (
            <OrderItem
              key={`${child.productName}-${child.variantName ?? "none"}-${index}`}
              item={child}
              isChild
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Totals({ order }: { order: CustomerOrderStatus }) {
  return (
    <div className="flex justify-end">
      <div className="min-w-56 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-6 text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>
        {order.discountTotal > 0 ? (
          <div className="flex items-center justify-between gap-6 text-success">
            <span>Discounts</span>
            <span>-{formatMoney(order.discountTotal)}</span>
          </div>
        ) : null}
        {order.serviceFeeTotal > 0 ? (
          <div className="flex items-center justify-between gap-6 text-muted-foreground">
            <span>Service fee</span>
            <span>{formatMoney(order.serviceFeeTotal)}</span>
          </div>
        ) : null}
        {order.taxTotal > 0 ? (
          <div className="flex items-center justify-between gap-6 text-muted-foreground">
            <span>Tax</span>
            <span>{formatMoney(order.taxTotal)}</span>
          </div>
        ) : null}
        {order.tipTotal > 0 ? (
          <div className="flex items-center justify-between gap-6 text-muted-foreground">
            <span>Tip</span>
            <span>{formatMoney(order.tipTotal)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-6 border-t pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

function PrepMessage({ order }: { order: CustomerOrderStatus }) {
  if (order.estimatedReadyAt) {
    return (
      <p className="text-sm text-muted-foreground">
        Estimated ready time:{" "}
        <span className="font-medium text-foreground">
          {formatDateTime(
            order.estimatedReadyAt,
            order.locationAddress.timezone
          )}
        </span>
      </p>
    )
  }

  if (order.estimatedPrepMinutes) {
    return (
      <p className="text-sm text-muted-foreground">
        Estimated prep time:{" "}
        <span className="font-medium text-foreground">
          {order.estimatedPrepMinutes} minutes
        </span>
      </p>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      Refresh this page for the latest status.
    </p>
  )
}

export function CustomerOrderStatusPage({
  order,
}: {
  order: CustomerOrderStatus
}) {
  const statusLabel = getCustomerOrderStatusLabel(order.orderStatus)
  const statusDescription = getCustomerOrderStatusDescription({
    status: order.orderStatus,
    fulfillmentType: order.fulfillmentType,
  })
  const menuHref = `/businesses/${encodeURIComponent(order.businessSlug)}/menu`
  const statusHref = `/businesses/${encodeURIComponent(
    order.businessSlug
  )}/orders/${encodeURIComponent(order.orderNumber)}`

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {order.businessName}
          </p>
          <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed{" "}
            {formatDateTime(order.placedAt, order.locationAddress.timezone)}
          </p>
        </div>

        <ThemedCard className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <span className="inline-flex w-fit rounded-full border border-success/30 bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                {statusLabel}
              </span>
              <h2 className="text-xl font-semibold">{statusDescription}</h2>
              <PrepMessage order={order} />
            </div>

            <ThemedButton asChild variant="outline" className="w-fit">
              <Link href={statusHref} replace>
                <RefreshCw aria-hidden="true" className="size-4" />
                Refresh status
              </Link>
            </ThemedButton>
          </div>
        </ThemedCard>

        <div className="grid gap-4 md:grid-cols-2">
          <ThemedCard className="p-5">
            <h2 className="font-semibold">Restaurant</h2>
            <div className="mt-3">
              <LocationAddress order={order} />
            </div>
          </ThemedCard>

          <ThemedCard className="p-5">
            <h2 className="font-semibold">Order details</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">
                  {formatLabel(order.fulfillmentType)}
                </span>
              </div>
              {order.customerName ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
              ) : null}
            </div>
          </ThemedCard>
        </div>

        <ThemedCard className="p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Order summary</h2>
              <p className="text-sm text-muted-foreground">
                {order.items.length}{" "}
                {order.items.length === 1 ? "item" : "items"}
              </p>
            </div>
            <p className="text-xl font-bold">{formatMoney(order.total)}</p>
          </div>

          <div className="mt-5 space-y-3">
            {order.items.length > 0 ? (
              order.items.map((item, index) => (
                <OrderItem
                  key={`${item.productName}-${item.variantName ?? "none"}-${index}`}
                  item={item}
                />
              ))
            ) : (
              <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                Order item details are not available yet. Contact the restaurant
                with your order number.
              </p>
            )}
          </div>

          <DiscountRows discounts={order.orderLevelDiscounts} />
          <div className="mt-5 border-t pt-5">
            <Totals order={order} />
          </div>
        </ThemedCard>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ThemedButton asChild variant="outline">
            <Link href={menuHref}>Back to menu</Link>
          </ThemedButton>
        </div>
      </div>
    </main>
  )
}

export function CustomerOrderNotFoundPage({
  businessSlug,
}: {
  businessSlug: string
}) {
  const menuHref = `/businesses/${encodeURIComponent(businessSlug)}/menu`

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <ThemedCard className="max-w-lg p-6 text-center">
        <h1 className="text-2xl font-bold">We could not find that order.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Check your order number or contact the restaurant.
        </p>
        <ThemedButton asChild className="mt-6">
          <Link href={menuHref}>Back to menu</Link>
        </ThemedButton>
      </ThemedCard>
    </main>
  )
}
