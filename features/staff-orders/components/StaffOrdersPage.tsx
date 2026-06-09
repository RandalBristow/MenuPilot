import Link from "next/link"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { updateOrderStatus } from "@/features/staff-orders/actions/update-order-status"
import { getRecentStaffOrders } from "@/features/staff-orders/queries/get-orders"
import {
  getAllowedNextStaffOrderStatuses,
  staffOrderActionLabels,
  type StaffOrder,
  type StaffOrderDiscount,
  type StaffOrderItem,
  type StaffOrderModifier,
} from "@/features/staff-orders/types/staff-order"
import { cn } from "@/lib/utils"

type StaffOrdersPageProps = {
  businessSlug?: string | null
  locationSlug?: string | null
  businessName?: string | null
  locationName?: string | null
  locationStatus?: string | null
  isLocationEnabled?: boolean | null
  isAcceptingOrders?: boolean | null
  adminHref?: string | null
  isLegacy?: boolean
}

type StaffOrderActionScope = {
  businessSlug?: string | null
  locationSlug?: string | null
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ")
}

function formatDealType(value: string | null) {
  if (value === "mix_and_match_fixed_unit_price") return "Mix & Match"
  if (value === "orderable_deal") return "Deal"

  return null
}

function formatComponentPricing(item: StaffOrderItem) {
  if (item.componentPricingMode === "fixed_price") {
    return `Fixed price ${formatMoney(
      item.componentBasePrice ?? item.componentFixedPrice ?? 0
    )}`
  }

  if (item.componentPricingMode === "included") {
    return "Included"
  }

  if (item.componentPricingMode === "normal_price") {
    return "Normal product price"
  }

  return null
}

function formatDiscountValue(discount: StaffOrderDiscount) {
  if (discount.discountTypeSnapshot === "percentage") {
    return `${discount.discountValueSnapshot}% off`
  }

  if (discount.discountTypeSnapshot === "fixed_price") {
    return `${formatMoney(discount.discountValueSnapshot)} fixed price`
  }

  return `${formatMoney(discount.discountValueSnapshot)} off`
}

function isCompletedStatus(status: string) {
  return status === "completed"
}

function isCanceledStatus(status: string) {
  return status === "canceled" || status === "cancelled"
}

function isActiveStatus(status: string) {
  return ["new", "accepted", "preparing", "ready"].includes(status)
}

function isTerminalStatus(status: string) {
  return isCompletedStatus(status) || isCanceledStatus(status)
}

function getOrderCardClassName(status: string) {
  if (status === "new") {
    return "space-y-5 border-primary/60 bg-primary/5 p-4 shadow-sm ring-1 ring-primary/15 sm:p-5"
  }

  if (isCompletedStatus(status)) {
    return "space-y-5 bg-muted/30 p-4 opacity-75 sm:p-5"
  }

  if (isCanceledStatus(status)) {
    return "space-y-5 bg-muted/30 p-4 opacity-70 sm:p-5"
  }

  return "space-y-5 p-4 sm:p-5"
}

function formatModifierDetail(modifier: StaffOrderModifier) {
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

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
      {children}
    </span>
  )
}

function StatusButtons({
  order,
  actionScope,
}: {
  order: StaffOrder
  actionScope: StaffOrderActionScope
}) {
  const actions = getAllowedNextStaffOrderStatuses(order.orderStatus)

  if (actions.length === 0) {
    return (
      <p className="rounded-lg bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
        No further status actions.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map((status) => (
        <form key={status} action={updateOrderStatus}>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="status" value={status} />
          {actionScope.businessSlug ? (
            <input
              type="hidden"
              name="businessSlug"
              value={actionScope.businessSlug}
            />
          ) : null}
          {actionScope.locationSlug ? (
            <input
              type="hidden"
              name="locationSlug"
              value={actionScope.locationSlug}
            />
          ) : null}
          <ThemedButton
            type="submit"
            variant={status === "canceled" ? "destructive" : "outline"}
            className="h-9 w-full"
          >
            {staffOrderActionLabels[status]}
          </ThemedButton>
        </form>
      ))}
    </div>
  )
}

function DiscountRows({ discounts }: { discounts: StaffOrderDiscount[] }) {
  if (discounts.length === 0) return null

  return (
    <div className="space-y-1 rounded-lg border border-success/20 bg-success/5 p-3 text-sm">
      <p className="font-semibold text-success">Applied discounts</p>
      {discounts.map((discount) => (
        <div
          key={discount.id}
          className="flex items-start justify-between gap-3 text-muted-foreground"
        >
          <span>
            <span className="font-medium text-foreground">
              {discount.nameSnapshot}
            </span>{" "}
            {formatDiscountValue(discount)}
          </span>
          <span className="shrink-0 font-medium text-success">
            -{formatMoney(discount.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

function ModifierRows({ modifiers }: { modifiers: StaffOrderModifier[] }) {
  if (modifiers.length === 0) return null

  return (
    <div className="mt-3 space-y-2 border-l pl-3 text-sm">
      {modifiers.map((modifier) => (
        <div key={modifier.id}>
          <span className="font-medium text-foreground">
            {modifier.groupName}:
          </span>{" "}
          <span className="text-muted-foreground">
            {modifier.optionName}
            {formatModifierDetail(modifier)}
          </span>
        </div>
      ))}
    </div>
  )
}

function StaffOrderChildItem({ item }: { item: StaffOrderItem }) {
  const componentPricing = formatComponentPricing(item)

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {item.componentLabel ? (
            <p className="text-xs font-medium text-muted-foreground">
              {item.componentLabel}
            </p>
          ) : null}
          <p className="font-medium">{item.productName}</p>
          {item.variantName ? (
            <p className="text-sm text-muted-foreground">{item.variantName}</p>
          ) : null}
          {componentPricing ? (
            <p className="text-sm text-muted-foreground">{componentPricing}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium">Qty {item.quantity}</p>
          {item.lineSubtotal > 0 ? (
            <p className="text-sm text-muted-foreground">
              Extras {formatMoney(item.lineSubtotal)}
            </p>
          ) : null}
        </div>
      </div>
      <ModifierRows modifiers={item.modifiers} />
    </div>
  )
}

function OrderTotals({ order }: { order: StaffOrder }) {
  const hasDiscount = order.discountTotal > 0

  if (!hasDiscount) return null

  return (
    <div className="flex justify-end text-sm">
      <div className="min-w-48 space-y-1">
        <div className="flex items-center justify-between gap-6 text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-success">
          <span>Discounts</span>
          <span>-{formatMoney(order.discountTotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 border-t pt-1 font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

function OrderItems({ order }: { order: StaffOrder }) {
  return (
    <div className="space-y-3">
      {order.items.map((item) => {
        const dealTypeLabel = formatDealType(item.specialType)

        return (
          <div key={item.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.productName}</p>
                  {dealTypeLabel ? (
                    <StatusBadge>{dealTypeLabel}</StatusBadge>
                  ) : null}
                </div>
                {item.variantName ? (
                  <p className="text-sm text-muted-foreground">
                    {item.variantName}
                  </p>
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

            {item.children.length > 0 ? (
              <div className="mt-3 space-y-2 border-l pl-3">
                {item.children.map((child) => (
                  <StaffOrderChildItem key={child.id} item={child} />
                ))}
              </div>
            ) : null}

            {item.discounts.length > 0 ? (
              <div className="mt-3 space-y-1 border-l border-success/30 pl-3 text-sm">
                {item.discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="flex items-start justify-between gap-3 text-success"
                  >
                    <span>
                      {discount.nameSnapshot} {formatDiscountValue(discount)}
                    </span>
                    <span className="shrink-0 font-medium">
                      -{formatMoney(discount.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function OrderCard({
  order,
  actionScope,
}: {
  order: StaffOrder
  actionScope: StaffOrderActionScope
}) {
  return (
    <ThemedCard className={getOrderCardClassName(order.orderStatus)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold">{order.orderNumber}</h2>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge>{formatLabel(order.fulfillmentType)}</StatusBadge>
            <StatusBadge>{formatLabel(order.orderStatus)}</StatusBadge>
            <StatusBadge>{formatLabel(order.paymentStatus)}</StatusBadge>
          </div>
        </div>

        <p className="text-2xl font-bold">{formatMoney(order.total)}</p>
      </div>

      <div className="grid gap-3 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Customer</p>
          <p className="font-medium">{order.customerName || "Guest"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Phone</p>
          <p className="font-medium">{order.customerPhone || "Not provided"}</p>
        </div>
      </div>

      <OrderItems order={order} />
      <DiscountRows discounts={order.orderLevelDiscounts} />
      <OrderTotals order={order} />
      <StatusButtons order={order} actionScope={actionScope} />
    </ThemedCard>
  )
}

function OrdersSection({
  title,
  description,
  orders,
  actionScope,
}: {
  title: string
  description: string
  orders: StaffOrder[]
  actionScope: StaffOrderActionScope
}) {
  if (orders.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            actionScope={actionScope}
          />
        ))}
      </div>
    </section>
  )
}

function getLocationWarning({
  locationStatus,
  isLocationEnabled,
  isAcceptingOrders,
}: StaffOrdersPageProps) {
  const warnings = []

  if (locationStatus && locationStatus !== "active") {
    warnings.push(`Location status is ${locationStatus}.`)
  }

  if (isLocationEnabled === false) {
    warnings.push("Location is disabled.")
  }

  if (isAcceptingOrders === false) {
    warnings.push("Location is not accepting new orders.")
  }

  return warnings.join(" ")
}

function LocationStatePill({
  label,
  isPositive,
}: {
  label: string
  isPositive: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium",
        isPositive
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      {label}
    </span>
  )
}

export async function StaffOrdersPage({
  businessSlug = null,
  locationSlug = null,
  businessName = "Pronto Demo",
  locationName = "Main Street",
  locationStatus = "active",
  isLocationEnabled = true,
  isAcceptingOrders = true,
  adminHref = null,
  isLegacy = false,
}: StaffOrdersPageProps = {}) {
  const orders = await getRecentStaffOrders({ businessSlug, locationSlug })
  const activeOrders = orders.filter((order) =>
    isActiveStatus(order.orderStatus)
  )
  const terminalOrders = orders.filter((order) =>
    isTerminalStatus(order.orderStatus)
  )
  const locationWarning = getLocationWarning({
    locationStatus,
    isLocationEnabled,
    isAcceptingOrders,
  })
  const actionScope = { businessSlug, locationSlug }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          {adminHref ? (
            <Link
              href={adminHref}
              className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to business admin
            </Link>
          ) : null}

          <div className="space-y-2">
            <ThemedHeading>Staff Orders</ThemedHeading>
            <p className="text-sm text-muted-foreground">
              Recent orders for {businessName}, {locationName}.
            </p>
            {isLegacy ? (
              <p className="text-xs font-medium text-muted-foreground">
                Legacy demo route. Use the business/location-scoped order route
                for tenant-specific staff work.
              </p>
            ) : null}
          </div>

          <ThemedCard className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">{locationName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Location order queue for {businessName}.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge>{locationStatus ?? "unknown"}</StatusBadge>
                <LocationStatePill
                  label={isLocationEnabled ? "Enabled" : "Disabled"}
                  isPositive={Boolean(isLocationEnabled)}
                />
                <LocationStatePill
                  label={
                    isAcceptingOrders
                      ? "Accepting orders"
                      : "Not accepting orders"
                  }
                  isPositive={Boolean(isAcceptingOrders)}
                />
              </div>
            </div>
          </ThemedCard>

          {locationWarning ? (
            <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <p>
                {locationWarning} Existing orders remain visible for staff
                review and status updates.
              </p>
            </div>
          ) : null}
        </div>

        {orders.length === 0 ? (
          <ThemedCard className="p-6 text-center">
            <p className="font-semibold">No orders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New orders will appear here after checkout.
            </p>
          </ThemedCard>
        ) : (
          <div className="space-y-8">
            <OrdersSection
              title="Active orders"
              description="New and in-progress orders that need staff attention."
              orders={activeOrders}
              actionScope={actionScope}
            />

            <OrdersSection
              title="Completed and canceled"
              description="Recently closed orders for quick reference."
              orders={terminalOrders}
              actionScope={actionScope}
            />
          </div>
        )}
      </div>
    </main>
  )
}
