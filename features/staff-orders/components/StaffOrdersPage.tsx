import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { updateOrderStatus } from "@/features/staff-orders/actions/update-order-status"
import { getRecentStaffOrders } from "@/features/staff-orders/queries/get-orders"
import {
  getAllowedNextStaffOrderStatuses,
  staffOrderActionLabels,
  type StaffOrder,
  type StaffOrderModifier,
} from "@/features/staff-orders/types/staff-order"

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

function StatusButtons({ order }: { order: StaffOrder }) {
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

function OrderItems({ order }: { order: StaffOrder }) {
  return (
    <div className="space-y-3">
      {order.items.map((item) => (
        <div key={item.id} className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{item.productName}</p>
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

          {item.modifiers.length > 0 ? (
            <div className="mt-3 space-y-2 border-l pl-3 text-sm">
              {item.modifiers.map((modifier) => (
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
          ) : null}
        </div>
      ))}
    </div>
  )
}

function OrderCard({ order }: { order: StaffOrder }) {
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
      <StatusButtons order={order} />
    </ThemedCard>
  )
}

function OrdersSection({
  title,
  description,
  orders,
}: {
  title: string
  description: string
  orders: StaffOrder[]
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
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  )
}

export async function StaffOrdersPage() {
  const orders = await getRecentStaffOrders()
  const activeOrders = orders.filter((order) =>
    isActiveStatus(order.orderStatus)
  )
  const terminalOrders = orders.filter((order) =>
    isTerminalStatus(order.orderStatus)
  )

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <ThemedHeading>Staff Orders</ThemedHeading>
          <p className="text-sm text-muted-foreground">
            Recent orders for Pronto Demo, Main Street.
          </p>
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
            />

            <OrdersSection
              title="Completed and canceled"
              description="Recently closed orders for quick reference."
              orders={terminalOrders}
            />
          </div>
        )}
      </div>
    </main>
  )
}
