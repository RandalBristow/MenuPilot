import {
  CustomerOrderNotFoundPage,
  CustomerOrderStatusPage,
} from "@/features/order-status/components/CustomerOrderStatusPage"
import { getCustomerOrderStatus } from "@/features/order-status/queries/get-customer-order-status"

type CustomerOrderStatusRouteProps = {
  params: Promise<{
    businessSlug: string
    orderNumber: string
  }>
}

export default async function CustomerOrderStatusRoute({
  params,
}: CustomerOrderStatusRouteProps) {
  const { businessSlug, orderNumber } = await params
  const order = await getCustomerOrderStatus({
    businessSlug,
    orderNumber: decodeURIComponent(orderNumber),
  })

  if (!order) {
    return <CustomerOrderNotFoundPage businessSlug={businessSlug} />
  }

  return <CustomerOrderStatusPage order={order} />
}
