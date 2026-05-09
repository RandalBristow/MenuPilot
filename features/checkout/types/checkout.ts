export type FulfillmentType = "pickup" | "delivery"

export type CheckoutFormValues = {
  customerName: string
  phone: string
  email: string
  fulfillmentType: FulfillmentType
  orderNotes: string
}
