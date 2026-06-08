import type {
  SpecialAvailabilityWindow,
  SpecialType,
} from "@/features/specials/types/special"
import { getSpecialComputedStatus } from "@/features/specials/utils/special-schedule"

export type OrderableDealPricingBehavior = "included_base"

export type OrderableDealComponent = {
  componentId: string
  label: string
  sortOrder: number
  requiredQuantity: number
  minQuantity: number
  maxQuantity: number
  pricingBehavior: OrderableDealPricingBehavior
  isRequired: boolean
  allowedProductIds: string[]
  allowedProductVariantOptions?: Array<{
    productId: string
    allowedVariantOptionIds: string[]
  }>
  modifierGroupOverrides?: Array<{
    productId: string
    modifierGroupId: string
    includedSelectionCount: number
  }>
}

export type OrderableDealCandidate = {
  businessId: string
  specialId: string
  name: string
  specialType: SpecialType
  isEnabled: boolean
  startsAt?: string | Date | null
  endsAt?: string | Date | null
  availabilityWindows?: SpecialAvailabilityWindow[] | null
  dealBasePrice: number
  components: OrderableDealComponent[]
}

export type OrderableDealSelectedChild = {
  componentId: string
  childLineId: string
  productId: string
  productName: string
  selectedVariantOptionId?: string | null
  quantity: number
  configuredLineTotal?: number | null
  basePrice?: number | null
  chargedModifierTotal?: number | null
  modifierExtraTotal?: number | null
  childExtraTotal?: number | null
  variantName?: string | null
  configurationSnapshot?: Record<string, unknown> | null
}

export type ValidateAndPriceOrderableDealInput = {
  businessId: string
  currentTime: Date
  timeZone?: string | null
  deal: OrderableDealCandidate
  children: OrderableDealSelectedChild[]
}

export type OrderableDealValidationErrorCode =
  | "wrong_special_type"
  | "wrong_business"
  | "disabled_deal"
  | "scheduled_deal"
  | "expired_deal"
  | "inactive_now"
  | "invalid_base_price"
  | "invalid_component_quantity_rule"
  | "unsupported_pricing_behavior"
  | "unknown_component"
  | "invalid_child_quantity"
  | "product_not_allowed"
  | "variant_not_allowed"
  | "missing_required_component"
  | "below_min_quantity"
  | "above_max_quantity"
  | "negative_child_extra"

export type OrderableDealValidationError = {
  code: OrderableDealValidationErrorCode
  message: string
  componentId?: string
  childLineId?: string
  productId?: string
}

export type OrderableDealPricedChild = {
  componentId: string
  childLineId: string
  productId: string
  productName: string
  quantity: number
  configuredLineTotal: number | null
  basePrice: number | null
  childExtraTotal: number
  variantName: string | null
}

export type OrderableDealPricedComponent = {
  componentId: string
  label: string
  sortOrder: number
  requiredQuantity: number
  minQuantity: number
  maxQuantity: number
  selectedQuantity: number
  pricingBehavior: OrderableDealPricingBehavior
  children: OrderableDealPricedChild[]
}

export type ValidateAndPriceOrderableDealResult =
  | {
      ok: true
      businessId: string
      specialId: string
      dealName: string
      dealBasePrice: number
      childExtraTotal: number
      total: number
      components: OrderableDealPricedComponent[]
      warnings: []
    }
  | {
      ok: false
      errors: OrderableDealValidationError[]
    }

function isFiniteNonnegative(value: number) {
  return Number.isFinite(value) && value >= 0
}

function toMoney(value: number) {
  if (!Number.isFinite(value)) return 0

  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getChildExtraTotal(child: OrderableDealSelectedChild) {
  return (
    child.childExtraTotal ??
    child.modifierExtraTotal ??
    child.chargedModifierTotal ??
    0
  )
}

function getComponentSelectedQuantity(children: OrderableDealSelectedChild[]) {
  return children.length
}

function isValidComponentQuantityRule(component: OrderableDealComponent) {
  return (
    Number.isInteger(component.requiredQuantity) &&
    Number.isInteger(component.minQuantity) &&
    Number.isInteger(component.maxQuantity) &&
    component.requiredQuantity >= 0 &&
    component.minQuantity >= 0 &&
    component.maxQuantity >= 0 &&
    component.minQuantity <= component.maxQuantity &&
    component.requiredQuantity >= component.minQuantity &&
    component.requiredQuantity <= component.maxQuantity
  )
}

function getScheduleError({
  deal,
  currentTime,
  timeZone,
}: {
  deal: OrderableDealCandidate
  currentTime: Date
  timeZone?: string | null
}): OrderableDealValidationError | null {
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

function getSortedComponents(components: OrderableDealComponent[]) {
  return [...components].sort(
    (first, second) =>
      first.sortOrder - second.sortOrder ||
      first.label.localeCompare(second.label) ||
      first.componentId.localeCompare(second.componentId)
  )
}

function getAllowedVariantOptionIds({
  component,
  productId,
}: {
  component: OrderableDealComponent
  productId: string
}) {
  return (
    component.allowedProductVariantOptions?.find(
      (restriction) => restriction.productId === productId
    )?.allowedVariantOptionIds ?? []
  )
}

export function validateAndPriceOrderableDeal({
  businessId,
  currentTime,
  timeZone,
  deal,
  children,
}: ValidateAndPriceOrderableDealInput): ValidateAndPriceOrderableDealResult {
  const errors: OrderableDealValidationError[] = []

  if (deal.specialType !== "orderable_deal") {
    errors.push({
      code: "wrong_special_type",
      message: `${deal.name} is not an orderable deal.`,
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

  if (!isFiniteNonnegative(deal.dealBasePrice)) {
    errors.push({
      code: "invalid_base_price",
      message: `${deal.name} has an invalid base price.`,
    })
  }

  const componentsById = new Map(
    deal.components.map((component) => [component.componentId, component])
  )
  const childrenByComponentId = new Map<string, OrderableDealSelectedChild[]>()

  for (const component of deal.components) {
    if (!isValidComponentQuantityRule(component)) {
      errors.push({
        code: "invalid_component_quantity_rule",
        message: `${component.label} has invalid quantity rules.`,
        componentId: component.componentId,
      })
    }

    if (component.pricingBehavior !== "included_base") {
      errors.push({
        code: "unsupported_pricing_behavior",
        message: `${component.label} uses an unsupported pricing behavior.`,
        componentId: component.componentId,
      })
    }
  }

  for (const child of children) {
    const component = componentsById.get(child.componentId)

    if (!component) {
      errors.push({
        code: "unknown_component",
        message: `${child.productName} belongs to an unknown deal component.`,
        componentId: child.componentId,
        childLineId: child.childLineId,
        productId: child.productId,
      })
      continue
    }

    if (!Number.isInteger(child.quantity) || child.quantity <= 0) {
      errors.push({
        code: "invalid_child_quantity",
        message: `${child.productName} has an invalid deal quantity.`,
        componentId: child.componentId,
        childLineId: child.childLineId,
        productId: child.productId,
      })
    }

    if (!component.allowedProductIds.includes(child.productId)) {
      errors.push({
        code: "product_not_allowed",
        message: `${child.productName} is not allowed for ${component.label}.`,
        componentId: child.componentId,
        childLineId: child.childLineId,
        productId: child.productId,
      })
    }

    const allowedVariantOptionIds = getAllowedVariantOptionIds({
      component,
      productId: child.productId,
    })

    if (
      allowedVariantOptionIds.length > 0 &&
      (!child.selectedVariantOptionId ||
        !allowedVariantOptionIds.includes(child.selectedVariantOptionId))
    ) {
      errors.push({
        code: "variant_not_allowed",
        message: `${child.productName} uses a variant that is not allowed for ${component.label}.`,
        componentId: child.componentId,
        childLineId: child.childLineId,
        productId: child.productId,
      })
    }

    const childExtraTotal = getChildExtraTotal(child)
    if (!isFiniteNonnegative(childExtraTotal)) {
      errors.push({
        code: "negative_child_extra",
        message: `${child.productName} has an invalid deal extra charge.`,
        componentId: child.componentId,
        childLineId: child.childLineId,
        productId: child.productId,
      })
    }

    const currentChildren = childrenByComponentId.get(child.componentId) ?? []
    childrenByComponentId.set(child.componentId, [...currentChildren, child])
  }

  for (const component of deal.components) {
    const componentChildren =
      childrenByComponentId.get(component.componentId) ?? []
    const selectedQuantity = getComponentSelectedQuantity(componentChildren)
    const effectiveMinQuantity = component.isRequired
      ? Math.max(component.minQuantity, component.requiredQuantity)
      : component.minQuantity

    if (selectedQuantity < effectiveMinQuantity) {
      errors.push({
        code: component.isRequired
          ? "missing_required_component"
          : "below_min_quantity",
        message: component.isRequired
          ? `Please complete ${component.label}.`
          : `${component.label} needs at least ${effectiveMinQuantity} selection(s).`,
        componentId: component.componentId,
      })
    }

    if (selectedQuantity > component.maxQuantity) {
      errors.push({
        code: "above_max_quantity",
        message: `${component.label} allows no more than ${component.maxQuantity} selection(s).`,
        componentId: component.componentId,
      })
    }
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    }
  }

  const sortedComponents = getSortedComponents(deal.components)
  const pricedComponents = sortedComponents.map((component) => {
    const componentChildren =
      childrenByComponentId.get(component.componentId) ?? []
    const pricedChildren = componentChildren.map((child) => ({
      componentId: child.componentId,
      childLineId: child.childLineId,
      productId: child.productId,
      productName: child.productName,
      quantity: child.quantity,
      configuredLineTotal:
        child.configuredLineTotal === undefined
          ? null
          : child.configuredLineTotal,
      basePrice: child.basePrice === undefined ? null : child.basePrice,
      childExtraTotal: toMoney(getChildExtraTotal(child)),
      variantName: child.variantName ?? null,
    }))

    return {
      componentId: component.componentId,
      label: component.label,
      sortOrder: component.sortOrder,
      requiredQuantity: component.requiredQuantity,
      minQuantity: component.minQuantity,
      maxQuantity: component.maxQuantity,
      selectedQuantity: getComponentSelectedQuantity(componentChildren),
      pricingBehavior: component.pricingBehavior,
      children: pricedChildren,
    }
  })
  const childExtraTotal = toMoney(
    pricedComponents.reduce(
      (sum, component) =>
        sum +
        component.children.reduce(
          (childSum, child) => childSum + child.childExtraTotal,
          0
        ),
      0
    )
  )
  const dealBasePrice = toMoney(deal.dealBasePrice)
  const total = toMoney(dealBasePrice + childExtraTotal)

  return {
    ok: true,
    businessId,
    specialId: deal.specialId,
    dealName: deal.name,
    dealBasePrice,
    childExtraTotal,
    total,
    components: pricedComponents,
    warnings: [],
  }
}
