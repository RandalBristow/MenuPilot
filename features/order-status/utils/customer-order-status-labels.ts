export function getCustomerOrderStatusLabel(status: string) {
  const normalized = status.toLowerCase()

  if (normalized === "pending" || normalized === "new") {
    return "Order received"
  }

  if (normalized === "accepted" || normalized === "confirmed") {
    return "Confirmed"
  }

  if (normalized === "preparing") {
    return "Being prepared"
  }

  if (normalized === "ready") {
    return "Ready for pickup"
  }

  if (normalized === "completed") {
    return "Completed"
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled"
  }

  return status.replaceAll("_", " ")
}

export function getCustomerOrderStatusDescription({
  status,
  fulfillmentType,
}: {
  status: string
  fulfillmentType: string
}) {
  const normalized = status.toLowerCase()

  if (normalized === "pending" || normalized === "new") {
    return "We received your order and the restaurant will review it soon."
  }

  if (normalized === "accepted" || normalized === "confirmed") {
    return "The restaurant confirmed your order."
  }

  if (normalized === "preparing") {
    return "Your order is being prepared."
  }

  if (normalized === "ready") {
    return fulfillmentType === "delivery"
      ? "Your order is ready for delivery handoff."
      : "Your order is ready for pickup."
  }

  if (normalized === "completed") {
    return "This order is complete."
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "This order was cancelled. Contact the restaurant if you have questions."
  }

  return "Refresh this page to check for the latest order status."
}
