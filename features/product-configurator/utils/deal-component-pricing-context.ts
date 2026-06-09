export type DealComponentPricingContext = {
  pricingMode: "included" | "fixed_price" | "normal_price"
  fixedPrice: number | null
  componentLabel: string
  displayPricingContext: boolean
}

export function getDealComponentBaseTotal({
  context,
  quantity,
}: {
  context?: DealComponentPricingContext | null
  quantity: number
}) {
  if (!context?.displayPricingContext) return null

  if (context.pricingMode === "fixed_price") {
    return (context.fixedPrice ?? 0) * quantity
  }

  if (context.pricingMode === "included") return 0

  return null
}

export function getDealComponentDisplayTotal({
  context,
  quantity,
  childExtraTotal,
}: {
  context?: DealComponentPricingContext | null
  quantity: number
  childExtraTotal: number
}) {
  const componentBaseTotal = getDealComponentBaseTotal({ context, quantity })

  if (componentBaseTotal === null) return null

  return Number((componentBaseTotal + childExtraTotal).toFixed(2))
}

export function getDealComponentPricingCopy(
  context?: DealComponentPricingContext | null
) {
  if (!context?.displayPricingContext) return null

  if (context.pricingMode === "fixed_price") return "Fixed deal price"
  if (context.pricingMode === "included") return "Included in deal"

  return "Normal product price is not supported yet"
}
