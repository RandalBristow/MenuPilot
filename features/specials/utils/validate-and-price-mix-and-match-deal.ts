import type {
  SpecialAvailabilityWindow,
  SpecialType,
} from "@/features/specials/types/special"
import { getSpecialComputedStatus } from "@/features/specials/utils/special-schedule"

export type MixAndMatchRule = {
  minQuantity: number
  maxQuantity?: number | null
  unitPrice: number
  allowExtraItems: boolean
}

export type MixAndMatchPoolProduct = {
  productId: string
  allowedVariantOptionIds?: string[] | null
  modifierGroupOverrides?: Array<{
    modifierGroupId: string
    includedSelectionCount: number
  }> | null
}

export type MixAndMatchDealCandidate = {
  businessId: string
  specialId: string
  name: string
  specialType: SpecialType
  isEnabled: boolean
  startsAt?: string | Date | null
  endsAt?: string | Date | null
  availabilityWindows?: SpecialAvailabilityWindow[] | null
  rule: MixAndMatchRule
  poolProducts: MixAndMatchPoolProduct[]
}

export type MixAndMatchSelectedChild = {
  childLineId: string
  productId: string
  productName: string
  quantity: number
  selectedVariantOptionId?: string | null
  configuredLineTotal?: number | null
  chargedModifierTotal?: number | null
  modifierExtraTotal?: number | null
  childExtraTotal?: number | null
  variantName?: string | null
  configurationSnapshot?: Record<string, unknown> | null
}

export type ValidateAndPriceMixAndMatchDealInput = {
  businessId: string
  currentTime: Date
  timeZone?: string | null
  deal: MixAndMatchDealCandidate
  children: MixAndMatchSelectedChild[]
}

export type MixAndMatchValidationErrorCode =
  | "wrong_special_type"
  | "wrong_business"
  | "disabled_deal"
  | "scheduled_deal"
  | "expired_deal"
  | "inactive_now"
  | "invalid_unit_price"
  | "invalid_quantity_rule"
  | "invalid_child_quantity"
  | "below_min_quantity"
  | "above_max_quantity"
  | "extra_items_not_allowed"
  | "product_not_allowed"
  | "variant_not_allowed"
  | "negative_child_extra"
  | "negative_total"

export type MixAndMatchValidationError = {
  code: MixAndMatchValidationErrorCode
  message: string
  childLineId?: string
  productId?: string
}

export type MixAndMatchPricedChild = {
  childLineId: string
  productId: string
  productName: string
  quantity: number
  selectedVariantOptionId: string | null
  variantName: string | null
  configuredLineTotal: number | null
  childExtraTotal: number
}

export type ValidateAndPriceMixAndMatchDealResult =
  | {
      ok: true
      businessId: string
      specialId: string
      dealName: string
      minQuantity: number
      maxQuantity: number | null
      unitPrice: number
      selectedQuantity: number
      mixBaseTotal: number
      childExtraTotal: number
      total: number
      children: MixAndMatchPricedChild[]
      warnings: []
    }
  | {
      ok: false
      errors: MixAndMatchValidationError[]
    }

function isFinitePositive(value: number) {
  return Number.isFinite(value) && value > 0
}

function isFiniteNonnegative(value: number) {
  return Number.isFinite(value) && value >= 0
}

function toMoney(value: number) {
  if (!Number.isFinite(value)) return 0

  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getChildExtraTotal(child: MixAndMatchSelectedChild) {
  return (
    child.childExtraTotal ??
    child.modifierExtraTotal ??
    child.chargedModifierTotal ??
    0
  )
}

function getScheduleError({
  deal,
  currentTime,
  timeZone,
}: {
  deal: MixAndMatchDealCandidate
  currentTime: Date
  timeZone?: string | null
}): MixAndMatchValidationError | null {
  const status = getSpecialComputedStatus({
    isEnabled: deal.isEnabled,
    startsAt: deal.startsAt,
    endsAt: deal.endsAt,
    availabilityWindows: deal.availabilityWindows,
    currentTime,
    timeZone,
  })

  if (status === "active") return null

  if (status === "disabled") {
    return {
      code: "disabled_deal",
      message: `${deal.name} is not currently enabled.`,
    }
  }

  if (status === "scheduled") {
    return {
      code: "scheduled_deal",
      message: `${deal.name} is not available yet.`,
    }
  }

  if (status === "expired") {
    return {
      code: "expired_deal",
      message: `${deal.name} is no longer available.`,
    }
  }

  return {
    code: "inactive_now",
    message: `${deal.name} is not available at this time.`,
  }
}

function isValidRule(rule: MixAndMatchRule) {
  return (
    Number.isInteger(rule.minQuantity) &&
    rule.minQuantity > 0 &&
    (rule.maxQuantity === null ||
      rule.maxQuantity === undefined ||
      (Number.isInteger(rule.maxQuantity) &&
        rule.maxQuantity >= rule.minQuantity)) &&
    isFinitePositive(rule.unitPrice)
  )
}

function getPoolProductMap(poolProducts: MixAndMatchPoolProduct[]) {
  return new Map(poolProducts.map((product) => [product.productId, product]))
}

function getSelectedQuantity(children: MixAndMatchSelectedChild[]) {
  return children.reduce((sum, child) => sum + child.quantity, 0)
}

function getAllowedVariantOptionIds(product: MixAndMatchPoolProduct | undefined) {
  return product?.allowedVariantOptionIds ?? []
}

export function validateAndPriceMixAndMatchDeal({
  businessId,
  currentTime,
  timeZone,
  deal,
  children,
}: ValidateAndPriceMixAndMatchDealInput): ValidateAndPriceMixAndMatchDealResult {
  const errors: MixAndMatchValidationError[] = []

  if (deal.specialType !== "mix_and_match_fixed_unit_price") {
    errors.push({
      code: "wrong_special_type",
      message: `${deal.name} is not a Mix & Match deal.`,
    })
  }

  if (deal.businessId !== businessId) {
    errors.push({
      code: "wrong_business",
      message: `${deal.name} does not belong to this business.`,
    })
  }

  const scheduleError = getScheduleError({ deal, currentTime, timeZone })
  if (scheduleError) errors.push(scheduleError)

  if (!isFinitePositive(deal.rule.unitPrice)) {
    errors.push({
      code: "invalid_unit_price",
      message: `${deal.name} has an invalid Mix & Match unit price.`,
    })
  }

  if (!isValidRule(deal.rule)) {
    errors.push({
      code: "invalid_quantity_rule",
      message: `${deal.name} has invalid Mix & Match quantity rules.`,
    })
  }

  const poolProductsById = getPoolProductMap(deal.poolProducts)

  for (const child of children) {
    const poolProduct = poolProductsById.get(child.productId)

    if (!Number.isInteger(child.quantity) || child.quantity <= 0) {
      errors.push({
        code: "invalid_child_quantity",
        message: `${child.productName} has an invalid Mix & Match quantity.`,
        childLineId: child.childLineId,
        productId: child.productId,
      })
    }

    if (!poolProduct) {
      errors.push({
        code: "product_not_allowed",
        message: `${child.productName} is not in the Mix & Match product pool.`,
        childLineId: child.childLineId,
        productId: child.productId,
      })
    }

    const allowedVariantOptionIds = getAllowedVariantOptionIds(poolProduct)

    if (
      allowedVariantOptionIds.length > 0 &&
      (!child.selectedVariantOptionId ||
        !allowedVariantOptionIds.includes(child.selectedVariantOptionId))
    ) {
      errors.push({
        code: "variant_not_allowed",
        message: `${child.productName} uses a variant that is not allowed for this Mix & Match deal.`,
        childLineId: child.childLineId,
        productId: child.productId,
      })
    }

    const childExtraTotal = getChildExtraTotal(child)
    if (!isFiniteNonnegative(childExtraTotal)) {
      errors.push({
        code: "negative_child_extra",
        message: `${child.productName} has an invalid Mix & Match extra charge.`,
        childLineId: child.childLineId,
        productId: child.productId,
      })
    }
  }

  const selectedQuantity = getSelectedQuantity(children)
  const maxQuantity = deal.rule.maxQuantity ?? null

  if (selectedQuantity < deal.rule.minQuantity) {
    errors.push({
      code: "below_min_quantity",
      message: `${deal.name} needs at least ${deal.rule.minQuantity} selected item(s).`,
    })
  }

  if (maxQuantity !== null && selectedQuantity > maxQuantity) {
    errors.push({
      code: "above_max_quantity",
      message: `${deal.name} allows no more than ${maxQuantity} selected item(s).`,
    })
  }

  if (!deal.rule.allowExtraItems && selectedQuantity > deal.rule.minQuantity) {
    errors.push({
      code: "extra_items_not_allowed",
      message: `${deal.name} does not allow extra Mix & Match items.`,
    })
  }

  const childExtraTotal = toMoney(
    children.reduce((sum, child) => sum + getChildExtraTotal(child), 0)
  )
  const unitPrice = toMoney(deal.rule.unitPrice)
  const mixBaseTotal = toMoney(selectedQuantity * unitPrice)
  const total = toMoney(mixBaseTotal + childExtraTotal)

  if (total < 0) {
    errors.push({
      code: "negative_total",
      message: `${deal.name} produced an invalid Mix & Match total.`,
    })
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    }
  }

  return {
    ok: true,
    businessId,
    specialId: deal.specialId,
    dealName: deal.name,
    minQuantity: deal.rule.minQuantity,
    maxQuantity,
    unitPrice,
    selectedQuantity,
    mixBaseTotal,
    childExtraTotal,
    total,
    children: children.map((child) => ({
      childLineId: child.childLineId,
      productId: child.productId,
      productName: child.productName,
      quantity: child.quantity,
      selectedVariantOptionId: child.selectedVariantOptionId ?? null,
      variantName: child.variantName ?? null,
      configuredLineTotal:
        child.configuredLineTotal === undefined
          ? null
          : child.configuredLineTotal,
      childExtraTotal: toMoney(getChildExtraTotal(child)),
    })),
    warnings: [],
  }
}
