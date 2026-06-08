import type { PublicSpecial } from "@/features/specials/types/public-special"

export type PublicSpecialProductContext = {
  productId: string
  menuGroupIds: string[]
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export function formatPublicSpecialDiscount(special: Pick<
  PublicSpecial,
  "specialType" | "discountType" | "discountValue"
>) {
  if (special.specialType === "orderable_deal") {
    return `Deal ${formatMoney(special.discountValue)}`
  }

  if (special.discountType === "percentage") {
    return `${special.discountValue}% off`
  }

  if (special.discountType === "fixed_price") {
    return `Fixed price ${formatMoney(special.discountValue)}`
  }

  return `${formatMoney(special.discountValue)} off`
}

export function getPublicSpecialEligibilitySummary(
  special: Pick<PublicSpecial, "specialType" | "minOrderAmount">
) {
  if (special.specialType === "cart_discount") {
    if (special.minOrderAmount && special.minOrderAmount > 0) {
      return `On orders of ${formatMoney(special.minOrderAmount)} or more.`
    }

    return "Applies to the order subtotal."
  }

  if (special.specialType === "orderable_deal") {
    return "Build this deal from eligible choices."
  }

  if (special.specialType === "fixed_price_line") {
    return "Applies to eligible menu items."
  }

  return "Applies to eligible menu items."
}

function hasLineEligibilityRows(special: PublicSpecial) {
  return (
    special.eligibleProducts.length > 0 ||
    special.eligibleMenuGroupIds.length > 0
  )
}

export function isPublicLineSpecial(special: PublicSpecial) {
  return (
    special.specialType === "line_discount" ||
    special.specialType === "fixed_price_line"
  )
}

export function isProductEligibleForPublicSpecial({
  special,
  product,
}: {
  special: PublicSpecial
  product: PublicSpecialProductContext
}) {
  if (!isPublicLineSpecial(special)) return false
  if (!hasLineEligibilityRows(special)) return true

  const productMatches = special.eligibleProducts.some(
    (eligibility) => eligibility.productId === product.productId
  )
  if (productMatches) return true

  return special.eligibleMenuGroupIds.some((menuGroupId) =>
    product.menuGroupIds.includes(menuGroupId)
  )
}

export function getPublicProductSpecialBadge({
  specials,
  product,
}: {
  specials: PublicSpecial[]
  product: PublicSpecialProductContext
}) {
  const special = specials.find((item) =>
    isProductEligibleForPublicSpecial({ special: item, product })
  )

  if (!special) return null

  return formatPublicSpecialDiscount(special)
}
