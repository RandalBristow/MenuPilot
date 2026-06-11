import type {
  BusinessPricingSettings,
  ServiceFeeType,
} from "@/lib/pricing/business-pricing-settings"

export type CheckoutTotalsInput = {
  subtotal: number
  discountTotal?: number
  tipTotal?: number
  settings: BusinessPricingSettings
}

export type CheckoutTotals = {
  subtotal: number
  discountTotal: number
  discountedSubtotal: number
  serviceFeeTotal: number
  taxTotal: number
  tipTotal: number
  total: number
  taxRatePercentSnapshot: number
  serviceFeeTypeSnapshot: ServiceFeeType
  serviceFeeValueSnapshot: number
  tipBasisSnapshot: "discounted_subtotal"
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function nonnegative(value: number | undefined) {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0
}

function calculateServiceFee({
  serviceFeeType,
  serviceFeeValue,
  basis,
}: {
  serviceFeeType: ServiceFeeType
  serviceFeeValue: number
  basis: number
}) {
  if (serviceFeeType === "fixed") {
    return roundCurrency(serviceFeeValue)
  }

  if (serviceFeeType === "percentage") {
    return roundCurrency((basis * serviceFeeValue) / 100)
  }

  return 0
}

export function calculateTipFromPercent({
  basis,
  percent,
}: {
  basis: number
  percent: number
}) {
  return roundCurrency((nonnegative(basis) * nonnegative(percent)) / 100)
}

export function calculateCheckoutTotals({
  subtotal,
  discountTotal = 0,
  tipTotal = 0,
  settings,
}: CheckoutTotalsInput): CheckoutTotals {
  const normalizedSubtotal = roundCurrency(nonnegative(subtotal))
  const normalizedDiscountTotal = roundCurrency(
    Math.min(nonnegative(discountTotal), normalizedSubtotal)
  )
  const discountedSubtotal = roundCurrency(
    normalizedSubtotal - normalizedDiscountTotal
  )
  const serviceFeeTypeSnapshot = settings.serviceFeeType
  const serviceFeeValueSnapshot =
    serviceFeeTypeSnapshot === "none"
      ? 0
      : roundCurrency(nonnegative(settings.serviceFeeValue))
  const serviceFeeTotal = calculateServiceFee({
    serviceFeeType: serviceFeeTypeSnapshot,
    serviceFeeValue: serviceFeeValueSnapshot,
    basis: discountedSubtotal,
  })
  const taxRatePercentSnapshot = nonnegative(settings.salesTaxRatePercent)
  const taxTotal = roundCurrency(
    (discountedSubtotal * taxRatePercentSnapshot) / 100
  )
  const normalizedTipTotal = roundCurrency(nonnegative(tipTotal))
  const total = roundCurrency(
    discountedSubtotal + serviceFeeTotal + taxTotal + normalizedTipTotal
  )

  return {
    subtotal: normalizedSubtotal,
    discountTotal: normalizedDiscountTotal,
    discountedSubtotal,
    serviceFeeTotal,
    taxTotal,
    tipTotal: normalizedTipTotal,
    total,
    taxRatePercentSnapshot,
    serviceFeeTypeSnapshot,
    serviceFeeValueSnapshot,
    tipBasisSnapshot: "discounted_subtotal",
  }
}
