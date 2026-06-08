import type {
  CartItem,
  DealCartItem,
} from "@/features/cart/types/cart"
import {
  isConfiguredCartItem,
  isDealCartItem,
} from "@/features/cart/utils/cart-items"
import type {
  OrderableDealCandidate,
  OrderableDealPricedComponent,
  OrderableDealSelectedChild,
} from "@/features/specials/utils/validate-and-price-orderable-deal"
import { validateAndPriceOrderableDeal } from "@/features/specials/utils/validate-and-price-orderable-deal"
import type {
  CheckoutProductConfig,
  CheckoutSubmittedCartItem,
  CheckoutModifierGroupConfig,
  ValidatedPricedCartItem,
  ValidatedPricedModifier,
} from "@/features/checkout/utils/validate-and-price-cart"
import { validateAndPriceCart } from "@/features/checkout/utils/validate-and-price-cart"

export type ValidatedPricedDealChildItem = {
  childLineId: string
  componentId: string
  componentLabel: string
  productId: string
  productName: string
  variantId: string | null
  variantName: string | null
  quantity: number
  unitPrice: number
  configuredLineTotal: number
  childExtraTotal: number
  modifiers: ValidatedPricedModifier[]
}

export type ValidatedPricedDealComponent = Omit<
  OrderableDealPricedComponent,
  "children"
> & {
  children: ValidatedPricedDealChildItem[]
}

export type ValidatedPricedDealItem = {
  itemType: "deal"
  cartItemId: string
  specialId: string
  specialName: string
  quantity: 1
  unitPrice: number
  lineSubtotal: number
  dealBasePrice: number
  childExtraTotal: number
  components: ValidatedPricedDealComponent[]
}

export type ValidatedPricedCheckoutItem =
  | ValidatedPricedCartItem
  | ValidatedPricedDealItem

export type ValidatedPricedCheckoutCart = {
  items: ValidatedPricedCheckoutItem[]
  normalItems: ValidatedPricedCartItem[]
  dealItems: ValidatedPricedDealItem[]
  subtotal: number
}

export type CheckoutItemValidationError = {
  code: string
  message: string
  cartItemId?: string
  productId?: string
}

export type ValidateAndPriceCheckoutItemsInput = {
  items: CartItem[]
  products: CheckoutProductConfig[]
  dealsById: Map<string, OrderableDealCandidate>
  businessId: string
  currentTime: Date
  timeZone?: string | null
}

export type ValidateAndPriceCheckoutItemsResult =
  | {
      ok: true
      cart: ValidatedPricedCheckoutCart
      errors: []
    }
  | {
      ok: false
      cart: null
      errors: CheckoutItemValidationError[]
    }

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function isMoneyEqual(first: number, second: number) {
  return Math.abs(roundCurrency(first) - roundCurrency(second)) < 0.01
}

function getVariantBasePrice({
  product,
  variantId,
}: {
  product: CheckoutProductConfig
  variantId: string | null
}) {
  if (!variantId) return product.basePrice

  return (
    product.variants?.find((variant) => variant.id === variantId)?.basePrice ??
    product.basePrice
  )
}

function getProductsById(products: CheckoutProductConfig[]) {
  return new Map(products.map((product) => [product.id, product]))
}

function buildSubmittedDealChildren(
  item: DealCartItem
): CheckoutSubmittedCartItem[] {
  return item.components.flatMap((component) =>
    component.children.map((child) => ({
      cartItemId: child.childLineId,
      productId: child.productId,
      productName: child.productName,
      variantId: child.variantId,
      variantName: child.variantName,
      quantity: child.quantity,
      unitPrice:
        child.configuredLineTotal && child.quantity > 0
          ? child.configuredLineTotal / child.quantity
          : 0,
      totalPrice: child.configuredLineTotal ?? 0,
      modifiers: child.modifiers,
    }))
  )
}

function applyDealModifierOverrides({
  product,
  overrides,
}: {
  product: CheckoutProductConfig
  overrides: Array<{
    modifierGroupId: string
    includedSelectionCount: number
  }>
}) {
  if (overrides.length === 0) return product

  const overridesByGroupId = new Map(
    overrides.map((override) => [
      override.modifierGroupId,
      override.includedSelectionCount,
    ])
  )

  return {
    ...product,
    modifierGroups: (product.modifierGroups ?? []).map(
      (group): CheckoutModifierGroupConfig => {
        const override = overridesByGroupId.get(group.id)

        if (override === undefined) return group

        return {
          ...group,
          includedQuantity: override,
        }
      }
    ),
  }
}

function getDealComponentProductModifierOverrides({
  deal,
  componentId,
  productId,
}: {
  deal: OrderableDealCandidate
  componentId: string
  productId: string
}) {
  const component = deal.components.find(
    (item) => item.componentId === componentId
  )

  return (
    component?.modifierGroupOverrides
      ?.filter((override) => override.productId === productId)
      .map((override) => ({
        modifierGroupId: override.modifierGroupId,
        includedSelectionCount: override.includedSelectionCount,
      })) ?? []
  )
}

function validateDealItem({
  item,
  productsById,
  dealsById,
  businessId,
  currentTime,
  timeZone,
}: {
  item: DealCartItem
  productsById: Map<string, CheckoutProductConfig>
  dealsById: Map<string, OrderableDealCandidate>
  businessId: string
  currentTime: Date
  timeZone?: string | null
}):
  | {
      ok: true
      item: ValidatedPricedDealItem
    }
  | {
      ok: false
      errors: CheckoutItemValidationError[]
    } {
  const deal = dealsById.get(item.specialId)

  if (!deal) {
    return {
      ok: false,
      errors: [
        {
          code: "unavailable_deal",
          message: `${item.specialName} is not available right now.`,
          cartItemId: item.cartItemId,
        },
      ],
    }
  }

  const errors: CheckoutItemValidationError[] = []
  const submittedChildrenById = new Map(
    buildSubmittedDealChildren(item).map((child) => [child.cartItemId, child])
  )
  const validatedChildrenById = new Map<string, ValidatedPricedCartItem>()
  const selectedChildren: OrderableDealSelectedChild[] = []

  for (const component of item.components) {
    for (const child of component.children) {
      const product = productsById.get(child.productId)

      if (!product) continue

      const submittedChild = submittedChildrenById.get(child.childLineId)
      if (!submittedChild) continue

      const childValidation = validateAndPriceCart({
        items: [submittedChild],
        products: [
          applyDealModifierOverrides({
            product,
            overrides: getDealComponentProductModifierOverrides({
              deal,
              componentId: component.componentId,
              productId: child.productId,
            }),
          }),
        ],
      })

      if (!childValidation.ok) {
        errors.push(
          ...childValidation.errors.map((error) => ({
            ...error,
            message: `Deal item error: ${error.message}`,
          }))
        )
        continue
      }

      const [validatedChild] = childValidation.cart.items
      validatedChildrenById.set(child.childLineId, validatedChild)

      const basePrice = getVariantBasePrice({
        product,
        variantId: validatedChild.variantId,
      })
      const serverChildExtraTotal = roundCurrency(
        Math.max(0, validatedChild.lineSubtotal - basePrice)
      )

      if (
        child.configuredLineTotal !== null &&
        !isMoneyEqual(child.configuredLineTotal, validatedChild.lineSubtotal)
      ) {
        errors.push({
          code: "stale_deal_child_price",
          message: `${validatedChild.productName} has changed. Please rebuild this deal.`,
          cartItemId: item.cartItemId,
          productId: child.productId,
        })
      }

      if (!isMoneyEqual(child.childExtraTotal, serverChildExtraTotal)) {
        errors.push({
          code: "stale_deal_child_extra",
          message: `${validatedChild.productName} extras have changed. Please rebuild this deal.`,
          cartItemId: item.cartItemId,
          productId: child.productId,
        })
      }

      selectedChildren.push({
        componentId: component.componentId,
        childLineId: child.childLineId,
        productId: validatedChild.productId,
        productName: validatedChild.productName,
        selectedVariantOptionId: validatedChild.variantId,
        quantity: validatedChild.quantity,
        configuredLineTotal: validatedChild.lineSubtotal,
        basePrice,
        childExtraTotal: serverChildExtraTotal,
        variantName: validatedChild.variantName,
      })
    }
  }

  const dealValidation = validateAndPriceOrderableDeal({
    businessId,
    currentTime,
    timeZone,
    deal,
    children: selectedChildren,
  })

  if (!dealValidation.ok) {
    errors.push(
      ...dealValidation.errors.map((error) => ({
        code: error.code,
        message: error.message,
        cartItemId: item.cartItemId,
        productId: error.productId,
      }))
    )
  } else if (!isMoneyEqual(item.totalPrice, dealValidation.total)) {
    errors.push({
      code: "stale_deal_total",
      message: `${dealValidation.dealName} has changed. Please rebuild this deal.`,
      cartItemId: item.cartItemId,
    })
  }

  if (errors.length > 0 || !dealValidation.ok) {
    return {
      ok: false,
      errors,
    }
  }

  const componentLabelsById = new Map(
    item.components.map((component) => [
      component.componentId,
      component.componentLabel,
    ])
  )
  const validatedDealComponents = dealValidation.components.map((component) => ({
    ...component,
    children: component.children.map((child) => {
      const validatedChild = validatedChildrenById.get(child.childLineId)

      if (!validatedChild) {
        throw new Error("Could not map validated deal child.")
      }

      return {
        childLineId: child.childLineId,
        componentId: component.componentId,
        componentLabel:
          componentLabelsById.get(component.componentId) ?? component.label,
        productId: validatedChild.productId,
        productName: validatedChild.productName,
        variantId: validatedChild.variantId,
        variantName: validatedChild.variantName,
        quantity: validatedChild.quantity,
        unitPrice: validatedChild.unitPrice,
        configuredLineTotal: validatedChild.lineSubtotal,
        childExtraTotal: child.childExtraTotal,
        modifiers: validatedChild.modifiers,
      }
    }),
  }))

  return {
    ok: true,
    item: {
      itemType: "deal",
      cartItemId: item.cartItemId,
      specialId: dealValidation.specialId,
      specialName: dealValidation.dealName,
      quantity: 1,
      unitPrice: dealValidation.total,
      lineSubtotal: dealValidation.total,
      dealBasePrice: dealValidation.dealBasePrice,
      childExtraTotal: dealValidation.childExtraTotal,
      components: validatedDealComponents,
    },
  }
}

export function validateAndPriceCheckoutItems({
  items,
  products,
  dealsById,
  businessId,
  currentTime,
  timeZone,
}: ValidateAndPriceCheckoutItemsInput): ValidateAndPriceCheckoutItemsResult {
  if (items.length === 0) {
    return {
      ok: false,
      cart: null,
      errors: [{ code: "empty_cart", message: "Cart is empty." }],
    }
  }

  const productsById = getProductsById(products)
  const errors: CheckoutItemValidationError[] = []
  const validatedItems: ValidatedPricedCheckoutItem[] = []
  const normalItems: ValidatedPricedCartItem[] = []
  const dealItems: ValidatedPricedDealItem[] = []

  for (const item of items) {
    if (isConfiguredCartItem(item)) {
      const result = validateAndPriceCart({ items: [item], products })

      if (!result.ok) {
        errors.push(...result.errors)
        continue
      }

      const [validatedItem] = result.cart.items
      validatedItems.push(validatedItem)
      normalItems.push(validatedItem)
      continue
    }

    if (isDealCartItem(item)) {
      const result = validateDealItem({
        item,
        productsById,
        dealsById,
        businessId,
        currentTime,
        timeZone,
      })

      if (!result.ok) {
        errors.push(...result.errors)
        continue
      }

      validatedItems.push(result.item)
      dealItems.push(result.item)
      continue
    }

    errors.push({
      code: "unsupported_cart_item",
      message: "Your cart contains an unsupported item.",
    })
  }

  if (errors.length > 0) {
    return {
      ok: false,
      cart: null,
      errors,
    }
  }

  return {
    ok: true,
    cart: {
      items: validatedItems,
      normalItems,
      dealItems,
      subtotal: roundCurrency(
        validatedItems.reduce((sum, item) => sum + item.lineSubtotal, 0)
      ),
    },
    errors: [],
  }
}
