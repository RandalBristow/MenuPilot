import { describe, expect, it } from "vitest"
import {
  getCustomerOrderStatusDescription,
  getCustomerOrderStatusLabel,
} from "./customer-order-status-labels"

describe("customer order status labels", () => {
  it.each([
    ["new", "Order received"],
    ["pending", "Order received"],
    ["accepted", "Confirmed"],
    ["confirmed", "Confirmed"],
    ["preparing", "Being prepared"],
    ["ready", "Ready for pickup"],
    ["completed", "Completed"],
    ["canceled", "Cancelled"],
    ["cancelled", "Cancelled"],
  ])("maps %s to %s", (status, label) => {
    expect(getCustomerOrderStatusLabel(status)).toBe(label)
  })

  it("returns friendly copy for staff status reloads", () => {
    expect(
      getCustomerOrderStatusDescription({
        status: "preparing",
        fulfillmentType: "pickup",
      })
    ).toBe("Your order is being prepared.")
  })
})
