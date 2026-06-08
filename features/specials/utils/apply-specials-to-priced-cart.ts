import type {
  SpecialCandidate,
  SpecialDiscountType,
  SpecialType,
} from "@/features/specials/types/special"

export type SpecialsPricedCartLine = {
  lineId: string
  orderItemId?: string | null
  productId: string
  menuGroupId?: string | null
  menuGroupIds?: string[] | null
  variantGroupOptionId?: string | null
  quantity: number
  lineSubtotal: number
  productNameSnapshot?: string | null
}

export type ApplySpecialsToPricedCartInput = {
  businessId: string
  locationId?: string | null
  currentTime: string | Date
  lines: SpecialsPricedCartLine[]
  specials: SpecialCandidate[]
}

export type AppliedSpecialDiscountSnapshot = {
  lineId: string | null
  orderItemId: string | null
  specialId: string
  businessId: string
  nameSnapshot: string
  specialTypeSnapshot: SpecialType
  discountTypeSnapshot: SpecialDiscountType
  discountValueSnapshot: number
  amount: number
  couponCodeSnapshot: string | null
}

export type AppliedSpecialLineTotal = {
  lineId: string
  lineSubtotal: number
  discountTotal: number
  total: number
}

export type ApplySpecialsToPricedCartResult = {
  subtotal: number
  discountTotal: number
  total: number
  appliedSpecialId: string | null
  appliedDiscounts: AppliedSpecialDiscountSnapshot[]
  lineTotals: AppliedSpecialLineTotal[]
}

type SpecialEvaluation = {
  special: SpecialCandidate
  discountTotal: number
  appliedDiscounts: AppliedSpecialDiscountSnapshot[]
  lineTotals: AppliedSpecialLineTotal[]
}

function toMoney(value: number) {
  if (!Number.isFinite(value)) return 0

  return Math.round((value + Number.EPSILON) * 100) / 100
}

function positiveMoney(value: number) {
  return Math.max(0, toMoney(value))
}

function parseTime(value: string | Date | null | undefined) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function isInsideSchedule({
  special,
  currentTime,
}: {
  special: SpecialCandidate
  currentTime: Date
}) {
  const startsAt = parseTime(special.startsAt)
  const endsAt = parseTime(special.endsAt)

  if (startsAt && currentTime < startsAt) return false
  if (endsAt && currentTime > endsAt) return false

  return true
}

function isActiveSpecial({
  special,
  businessId,
  currentTime,
}: {
  special: SpecialCandidate
  businessId: string
  currentTime: Date
}) {
  return (
    special.isEnabled &&
    special.businessId === businessId &&
    special.discountValue > 0 &&
    isInsideSchedule({ special, currentTime })
  )
}

function getLineMenuGroupIds(line: SpecialsPricedCartLine) {
  return [
    ...(line.menuGroupIds ?? []),
    ...(line.menuGroupId ? [line.menuGroupId] : []),
  ]
}

function matchesProductEligibility({
  special,
  line,
}: {
  special: SpecialCandidate
  line: SpecialsPricedCartLine
}) {
  const eligibleProducts = special.eligibleProducts ?? []
  if (eligibleProducts.length === 0) return false

  return eligibleProducts.some((eligibility) => {
    if (eligibility.productId !== line.productId) return false

    return (
      !eligibility.variantGroupOptionId ||
      eligibility.variantGroupOptionId === line.variantGroupOptionId
    )
  })
}

function matchesMenuGroupEligibility({
  special,
  line,
}: {
  special: SpecialCandidate
  line: SpecialsPricedCartLine
}) {
  const eligibleMenuGroupIds = special.eligibleMenuGroupIds ?? []
  if (eligibleMenuGroupIds.length === 0) return false

  const lineMenuGroupIds = getLineMenuGroupIds(line)

  return eligibleMenuGroupIds.some((menuGroupId) =>
    lineMenuGroupIds.includes(menuGroupId)
  )
}

function hasLineEligibilityRows(special: SpecialCandidate) {
  return (
    (special.eligibleProducts ?? []).length > 0 ||
    (special.eligibleMenuGroupIds ?? []).length > 0
  )
}

function isLineEligible({
  special,
  line,
}: {
  special: SpecialCandidate
  line: SpecialsPricedCartLine
}) {
  if (!hasLineEligibilityRows(special)) return true

  return (
    matchesProductEligibility({ special, line }) ||
    matchesMenuGroupEligibility({ special, line })
  )
}

function createLineDiscountSnapshot({
  special,
  businessId,
  line,
  amount,
}: {
  special: SpecialCandidate
  businessId: string
  line: SpecialsPricedCartLine
  amount: number
}): AppliedSpecialDiscountSnapshot {
  return {
    lineId: line.lineId,
    orderItemId: line.orderItemId ?? null,
    specialId: special.id,
    businessId,
    nameSnapshot: special.name,
    specialTypeSnapshot: special.specialType,
    discountTypeSnapshot: special.discountType,
    discountValueSnapshot: special.discountValue,
    amount,
    couponCodeSnapshot: null,
  }
}

function createCartDiscountSnapshot({
  special,
  businessId,
  amount,
}: {
  special: SpecialCandidate
  businessId: string
  amount: number
}): AppliedSpecialDiscountSnapshot {
  return {
    lineId: null,
    orderItemId: null,
    specialId: special.id,
    businessId,
    nameSnapshot: special.name,
    specialTypeSnapshot: special.specialType,
    discountTypeSnapshot: special.discountType,
    discountValueSnapshot: special.discountValue,
    amount,
    couponCodeSnapshot: null,
  }
}

function getBaseLineTotals(
  lines: SpecialsPricedCartLine[]
): AppliedSpecialLineTotal[] {
  return lines.map((line) => {
    const lineSubtotal = positiveMoney(line.lineSubtotal)

    return {
      lineId: line.lineId,
      lineSubtotal,
      discountTotal: 0,
      total: lineSubtotal,
    }
  })
}

function evaluateLineDiscount({
  special,
  businessId,
  lines,
}: {
  special: SpecialCandidate
  businessId: string
  lines: SpecialsPricedCartLine[]
}): SpecialEvaluation | null {
  if (
    special.specialType !== "line_discount" ||
    (special.discountType !== "percentage" &&
      special.discountType !== "fixed_amount")
  ) {
    return null
  }

  const lineTotals = getBaseLineTotals(lines)
  const appliedDiscounts = lines.flatMap((line, index) => {
    const lineSubtotal = positiveMoney(line.lineSubtotal)
    if (lineSubtotal <= 0 || !isLineEligible({ special, line })) return []

    const quantity = Math.max(0, Number(line.quantity) || 0)
    const rawDiscount =
      special.discountType === "percentage"
        ? lineSubtotal * (special.discountValue / 100)
        : special.discountValue * quantity
    const amount = Math.min(lineSubtotal, positiveMoney(rawDiscount))
    if (amount <= 0) return []

    lineTotals[index] = {
      ...lineTotals[index],
      discountTotal: amount,
      total: positiveMoney(lineSubtotal - amount),
    }

    return [
      createLineDiscountSnapshot({
        special,
        businessId,
        line,
        amount,
      }),
    ]
  })
  const discountTotal = positiveMoney(
    appliedDiscounts.reduce((sum, discount) => sum + discount.amount, 0)
  )

  if (discountTotal <= 0) return null

  return {
    special,
    discountTotal,
    appliedDiscounts,
    lineTotals,
  }
}

function evaluateFixedPriceLine({
  special,
  businessId,
  lines,
}: {
  special: SpecialCandidate
  businessId: string
  lines: SpecialsPricedCartLine[]
}): SpecialEvaluation | null {
  if (
    special.specialType !== "fixed_price_line" ||
    special.discountType !== "fixed_price"
  ) {
    return null
  }

  const lineTotals = getBaseLineTotals(lines)
  const appliedDiscounts = lines.flatMap((line, index) => {
    const lineSubtotal = positiveMoney(line.lineSubtotal)
    if (lineSubtotal <= 0 || !isLineEligible({ special, line })) return []

    const quantity = Math.max(0, Number(line.quantity) || 0)
    const fixedLineTotal = positiveMoney(special.discountValue * quantity)
    const amount = Math.min(
      lineSubtotal,
      positiveMoney(lineSubtotal - fixedLineTotal)
    )
    if (amount <= 0) return []

    lineTotals[index] = {
      ...lineTotals[index],
      discountTotal: amount,
      total: positiveMoney(lineSubtotal - amount),
    }

    return [
      createLineDiscountSnapshot({
        special,
        businessId,
        line,
        amount,
      }),
    ]
  })
  const discountTotal = positiveMoney(
    appliedDiscounts.reduce((sum, discount) => sum + discount.amount, 0)
  )

  if (discountTotal <= 0) return null

  return {
    special,
    discountTotal,
    appliedDiscounts,
    lineTotals,
  }
}

function evaluateCartDiscount({
  special,
  businessId,
  subtotal,
  lines,
}: {
  special: SpecialCandidate
  businessId: string
  subtotal: number
  lines: SpecialsPricedCartLine[]
}): SpecialEvaluation | null {
  if (
    special.specialType !== "cart_discount" ||
    (special.discountType !== "percentage" &&
      special.discountType !== "fixed_amount")
  ) {
    return null
  }

  if (subtotal <= 0) return null

  const minOrderAmount =
    special.minOrderAmount === null || special.minOrderAmount === undefined
      ? 0
      : special.minOrderAmount
  if (subtotal < minOrderAmount) return null

  const rawDiscount =
    special.discountType === "percentage"
      ? subtotal * (special.discountValue / 100)
      : special.discountValue
  const amount = Math.min(subtotal, positiveMoney(rawDiscount))
  if (amount <= 0) return null

  return {
    special,
    discountTotal: amount,
    appliedDiscounts: [
      createCartDiscountSnapshot({
        special,
        businessId,
        amount,
      }),
    ],
    lineTotals: getBaseLineTotals(lines),
  }
}

function evaluateSpecial({
  special,
  businessId,
  subtotal,
  lines,
}: {
  special: SpecialCandidate
  businessId: string
  subtotal: number
  lines: SpecialsPricedCartLine[]
}) {
  return (
    evaluateLineDiscount({ special, businessId, lines }) ??
    evaluateFixedPriceLine({ special, businessId, lines }) ??
    evaluateCartDiscount({ special, businessId, subtotal, lines })
  )
}

function compareEvaluations(
  current: SpecialEvaluation,
  next: SpecialEvaluation
) {
  if (next.discountTotal !== current.discountTotal) {
    return next.discountTotal > current.discountTotal ? next : current
  }

  return next.special.id.localeCompare(current.special.id) < 0 ? next : current
}

export function applySpecialsToPricedCart({
  businessId,
  currentTime,
  lines,
  specials,
}: ApplySpecialsToPricedCartInput): ApplySpecialsToPricedCartResult {
  const parsedCurrentTime = parseTime(currentTime) ?? new Date()
  const subtotal = positiveMoney(
    lines.reduce((sum, line) => sum + positiveMoney(line.lineSubtotal), 0)
  )
  const lineTotals = getBaseLineTotals(lines)

  if (subtotal <= 0 || lines.length === 0 || specials.length === 0) {
    return {
      subtotal,
      discountTotal: 0,
      total: subtotal,
      appliedSpecialId: null,
      appliedDiscounts: [],
      lineTotals,
    }
  }

  const bestEvaluation = specials
    .filter((special) =>
      isActiveSpecial({
        special,
        businessId,
        currentTime: parsedCurrentTime,
      })
    )
    .map((special) =>
      evaluateSpecial({
        special,
        businessId,
        subtotal,
        lines,
      })
    )
    .filter((evaluation): evaluation is SpecialEvaluation =>
      Boolean(evaluation)
    )
    .reduce<SpecialEvaluation | null>(
      (best, evaluation) =>
        best ? compareEvaluations(best, evaluation) : evaluation,
      null
    )

  if (!bestEvaluation) {
    return {
      subtotal,
      discountTotal: 0,
      total: subtotal,
      appliedSpecialId: null,
      appliedDiscounts: [],
      lineTotals,
    }
  }

  const discountTotal = Math.min(subtotal, bestEvaluation.discountTotal)

  return {
    subtotal,
    discountTotal,
    total: positiveMoney(subtotal - discountTotal),
    appliedSpecialId: bestEvaluation.special.id,
    appliedDiscounts: bestEvaluation.appliedDiscounts,
    lineTotals: bestEvaluation.lineTotals,
  }
}
