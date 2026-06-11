import { priceConfiguredProduct } from "../../../lib/pricing/price-configured-product"
import type { BusinessPricingSettings } from "@/lib/pricing/business-pricing-settings"
import {
  resolveVariantModifierOptionPrice,
  type VariantModifierOptionPriceOverride,
} from "../../product-configurator/utils/variant-modifier-pricing"

export type CheckoutSubmittedModifier = {
  optionId: string
  optionName: string
  groupId: string
  groupName: string
  placement: "left" | "whole" | "right"
  multiplier: number
  priceDelta: number
}

export type CheckoutSubmittedCartItem = {
  cartItemId: string
  productId: string
  productName: string
  variantId: string | null
  variantName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  modifiers: CheckoutSubmittedModifier[]
}

export type CheckoutProductConfig = {
  id: string
  name: string
  builderTemplate?: string | null
  pricingSettings?: BusinessPricingSettings | null
  isEnabled: boolean
  isSoldOut?: boolean
  basePrice: number
  variants?: CheckoutEffectiveVariant[]
  modifierGroups?: CheckoutModifierGroupConfig[]
  productDefaultModifierOptions?: CheckoutProductDefaultModifierOption[]
  modifierOptionOverrides?: CheckoutModifierOptionOverride[]
  variantModifierOptionAvailabilityRules?: CheckoutVariantModifierOptionAvailabilityRule[]
  variantModifierOptionPriceOverrides?: CheckoutVariantModifierOptionPriceOverride[]
}

export type CheckoutEffectiveVariant = {
  id: string
  name: string
  basePrice: number
  isEnabled: boolean
}

export type CheckoutModifierOptionGroupConfig = {
  id: string
  name: string
  isEnabled: boolean
}

export type CheckoutModifierOptionConfig = {
  id: string
  name: string
  priceDelta: number
  isEnabled: boolean
  isSoldOut?: boolean
  optionGroup?: CheckoutModifierOptionGroupConfig | null
}

export type CheckoutModifierGroupConfig = {
  id: string
  name: string
  isAssignmentEnabled: boolean
  isEnabled: boolean
  isRequired: boolean
  minRequired: number
  maxAllowed: number | null
  supportsPlacement: boolean
  supportsMultiplier: boolean
  minMultiplier?: number | null
  maxMultiplier?: number | null
  multiplierStep?: number | null
  includedQuantity?: number
  chargeForExtra?: boolean
  options: CheckoutModifierOptionConfig[]
}

export type CheckoutModifierOptionOverride = {
  modifierOptionId: string
  priceDeltaOverride?: number | null
  isEnabled?: boolean | null
}

export type CheckoutProductDefaultModifierOption = {
  modifier_option_id: string
  placement?: "left" | "whole" | "right" | null
  multiplier?: number | null
  quantity?: number | null
  is_enabled?: boolean | null
}

export type CheckoutVariantModifierOptionAvailabilityRule = {
  variantGroupOptionId: string
  modifierGroupId: string
  modifierOptionId: string
  isAvailable: boolean
  isEnabled: boolean
}

export type CheckoutVariantModifierOptionPriceOverride = {
  variantGroupOptionId: string
  modifierGroupId: string
  modifierOptionId: string
  priceDelta: number
  isEnabled: boolean
}

export type ValidatedPricedModifier = {
  optionId: string
  optionName: string
  groupId: string
  groupName: string
  placement: "left" | "whole" | "right"
  multiplier: number
  priceDelta: number
}

export type ValidatedPricedCartItem = {
  cartItemId: string
  productId: string
  productName: string
  variantId: string | null
  variantName: string | null
  quantity: number
  unitPrice: number
  lineSubtotal: number
  modifiers: ValidatedPricedModifier[]
}

export type ValidatedPricedCart = {
  items: ValidatedPricedCartItem[]
  subtotal: number
}

export type CheckoutValidationErrorCode =
  | "empty_cart"
  | "missing_product"
  | "disabled_product"
  | "sold_out_product"
  | "invalid_quantity"
  | "missing_variant"
  | "invalid_variant"
  | "unexpected_variant"
  | "invalid_modifier_group"
  | "disabled_modifier_group"
  | "invalid_modifier_option"
  | "disabled_modifier_option"
  | "sold_out_modifier_option"
  | "unavailable_modifier_option"
  | "missing_required_modifier"
  | "too_many_modifiers"
  | "invalid_modifier_placement"
  | "invalid_modifier_multiplier"

export type CheckoutValidationError = {
  code: CheckoutValidationErrorCode
  message: string
  cartItemId?: string
  productId?: string
}

export type ValidateAndPriceCartInput = {
  items: CheckoutSubmittedCartItem[]
  products: CheckoutProductConfig[]
}

export type ValidateAndPriceCartResult =
  | {
      ok: true
      cart: ValidatedPricedCart
      errors: []
    }
  | {
      ok: false
      cart: null
      errors: CheckoutValidationError[]
    }

function getProductsById(products: CheckoutProductConfig[]) {
  return new Map(products.map((product) => [product.id, product]))
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function isValidQuantity(quantity: number) {
  return Number.isInteger(quantity) && quantity > 0
}

function getEnabledVariants(product: CheckoutProductConfig) {
  return (product.variants ?? []).filter((variant) => variant.isEnabled)
}

function getModifierOverridesByOptionId(product: CheckoutProductConfig) {
  return new Map(
    (product.modifierOptionOverrides ?? []).map((override) => [
      override.modifierOptionId,
      override,
    ])
  )
}

function getVariantModifierOptionPriceOverrides(
  product: CheckoutProductConfig
): VariantModifierOptionPriceOverride[] {
  return (product.variantModifierOptionPriceOverrides ?? []).map(
    (override) => ({
      variant_group_option_id: override.variantGroupOptionId,
      modifier_group_id: override.modifierGroupId,
      modifier_option_id: override.modifierOptionId,
      price_delta: override.priceDelta,
      is_enabled: override.isEnabled,
    })
  )
}

function getActiveModifierGroups(product: CheckoutProductConfig) {
  return (product.modifierGroups ?? []).filter(
    (group) => group.isAssignmentEnabled && group.isEnabled
  )
}

function getEffectiveModifierOption({
  option,
  modifierGroupId,
  selectedVariantId,
  overridesByOptionId,
  variantPriceOverrides,
}: {
  option: CheckoutModifierOptionConfig
  modifierGroupId: string
  selectedVariantId: string | null
  overridesByOptionId: Map<string, CheckoutModifierOptionOverride>
  variantPriceOverrides: VariantModifierOptionPriceOverride[]
}) {
  const override = overridesByOptionId.get(option.id)

  if (!option.isEnabled || override?.isEnabled === false) return null
  if (option.optionGroup && !option.optionGroup.isEnabled) return null

  const inheritedPriceDelta = override?.priceDeltaOverride ?? option.priceDelta

  return {
    ...option,
    priceDelta: resolveVariantModifierOptionPrice({
      selectedVariantId,
      modifierGroupId,
      modifierOptionId: option.id,
      inheritedPriceDelta,
      priceOverrides: variantPriceOverrides,
    }),
  }
}

function isModifierOptionAvailableForVariant({
  selectedVariantId,
  modifierGroupId,
  modifierOptionId,
  product,
}: {
  selectedVariantId: string | null
  modifierGroupId: string
  modifierOptionId: string
  product: CheckoutProductConfig
}) {
  if (!selectedVariantId) return true

  const rule = (product.variantModifierOptionAvailabilityRules ?? []).find(
    (item) =>
      item.isEnabled &&
      item.variantGroupOptionId === selectedVariantId &&
      item.modifierGroupId === modifierGroupId &&
      item.modifierOptionId === modifierOptionId
  )

  return rule?.isAvailable ?? true
}

function getAvailableModifierOptions({
  group,
  product,
  selectedVariantId,
  overridesByOptionId,
  variantPriceOverrides,
}: {
  group: CheckoutModifierGroupConfig
  product: CheckoutProductConfig
  selectedVariantId: string | null
  overridesByOptionId: Map<string, CheckoutModifierOptionOverride>
  variantPriceOverrides: VariantModifierOptionPriceOverride[]
}) {
  return group.options
    .map((option) =>
      getEffectiveModifierOption({
        option,
        modifierGroupId: group.id,
        selectedVariantId,
        overridesByOptionId,
        variantPriceOverrides,
      })
    )
    .filter((option): option is CheckoutModifierOptionConfig =>
      Boolean(option)
    )
    .filter((option) =>
      isModifierOptionAvailableForVariant({
        selectedVariantId,
        modifierGroupId: group.id,
        modifierOptionId: option.id,
        product,
      })
    )
}

function validateVariant({
  item,
  product,
}: {
  item: CheckoutSubmittedCartItem
  product: CheckoutProductConfig
}):
  | {
      ok: true
      variantId: string | null
      variantName: string | null
      basePrice: number
    }
  | {
      ok: false
      error: CheckoutValidationError
    } {
  const enabledVariants = getEnabledVariants(product)

  if (enabledVariants.length === 0) {
    if (item.variantId) {
      const hasConfiguredVariants = (product.variants ?? []).length > 0

      return {
        ok: false,
        error: {
          code: hasConfiguredVariants ? "invalid_variant" : "unexpected_variant",
          message: hasConfiguredVariants
            ? `${product.name} has an unavailable variant selection.`
            : `${product.name} does not have variants.`,
          cartItemId: item.cartItemId,
          productId: item.productId,
        },
      }
    }

    return {
      ok: true,
      variantId: null,
      variantName: null,
      basePrice: product.basePrice,
    }
  }

  if (!item.variantId) {
    return {
      ok: false,
      error: {
        code: "missing_variant",
        message: `${product.name} requires a variant selection.`,
        cartItemId: item.cartItemId,
        productId: item.productId,
      },
    }
  }

  const selectedVariant = enabledVariants.find(
    (variant) => variant.id === item.variantId
  )

  if (!selectedVariant) {
    return {
      ok: false,
      error: {
        code: "invalid_variant",
        message: `${product.name} has an unavailable variant selection.`,
        cartItemId: item.cartItemId,
        productId: item.productId,
      },
    }
  }

  return {
    ok: true,
    variantId: selectedVariant.id,
    variantName: selectedVariant.name,
    basePrice: selectedVariant.basePrice,
  }
}

function buildModifierError({
  code,
  message,
  item,
  product,
}: {
  code: CheckoutValidationErrorCode
  message: string
  item: CheckoutSubmittedCartItem
  product: CheckoutProductConfig
}): CheckoutValidationError {
  return {
    code,
    message,
    cartItemId: item.cartItemId,
    productId: product.id,
  }
}

function isValidPlacement({
  group,
  placement,
}: {
  group: CheckoutModifierGroupConfig
  placement: CheckoutSubmittedModifier["placement"]
}) {
  if (group.supportsPlacement) return true

  return placement === "whole"
}

function isStepAligned({
  value,
  min,
  step,
}: {
  value: number
  min: number
  step: number
}) {
  if (step <= 0) return true

  const steps = (value - min) / step

  return Math.abs(steps - Math.round(steps)) < 0.000001
}

function isValidMultiplier({
  group,
  multiplier,
}: {
  group: CheckoutModifierGroupConfig
  multiplier: number
}) {
  if (!group.supportsMultiplier) return multiplier === 1

  const min = group.minMultiplier ?? 1
  const max = group.maxMultiplier ?? Number.MAX_SAFE_INTEGER
  const step = group.multiplierStep ?? 1

  return (
    multiplier >= min &&
    multiplier <= max &&
    isStepAligned({ value: multiplier, min, step })
  )
}

function validateModifiers({
  item,
  product,
  selectedVariantId,
  basePrice,
}: {
  item: CheckoutSubmittedCartItem
  product: CheckoutProductConfig
  selectedVariantId: string | null
  basePrice: number
}):
  | {
      ok: true
      modifiers: ValidatedPricedModifier[]
      unitPrice: number
    }
  | {
      ok: false
      errors: CheckoutValidationError[]
    } {
  const overridesByOptionId = getModifierOverridesByOptionId(product)
  const variantPriceOverrides = getVariantModifierOptionPriceOverrides(product)
  const activeGroups = getActiveModifierGroups(product)
  const groupsById = new Map(
    (product.modifierGroups ?? []).map((group) => [group.id, group])
  )
  const errors: CheckoutValidationError[] = []
  const validatedModifiers: ValidatedPricedModifier[] = []

  for (const modifier of item.modifiers) {
    const configuredGroup = groupsById.get(modifier.groupId)

    if (!configuredGroup) {
      errors.push(
        buildModifierError({
          code: "invalid_modifier_group",
          message: "A selected modifier group is not attached to this product.",
          item,
          product,
        })
      )
      continue
    }

    if (!configuredGroup.isAssignmentEnabled || !configuredGroup.isEnabled) {
      errors.push(
        buildModifierError({
          code: "disabled_modifier_group",
          message: `${configuredGroup.name} is no longer available.`,
          item,
          product,
        })
      )
      continue
    }

    const configuredOption = configuredGroup.options.find(
      (option) => option.id === modifier.optionId
    )

    if (!configuredOption) {
      errors.push(
        buildModifierError({
          code: "invalid_modifier_option",
          message: "A selected modifier option is not available for this product.",
          item,
          product,
        })
      )
      continue
    }

    if (configuredOption.isSoldOut) {
      errors.push(
        buildModifierError({
          code: "sold_out_modifier_option",
          message: `${configuredOption.name} is currently sold out.`,
          item,
          product,
        })
      )
      continue
    }

    const effectiveOption = getEffectiveModifierOption({
      option: configuredOption,
      modifierGroupId: configuredGroup.id,
      selectedVariantId,
      overridesByOptionId,
      variantPriceOverrides,
    })

    if (!effectiveOption) {
      errors.push(
        buildModifierError({
          code: "disabled_modifier_option",
          message: `${configuredOption.name} is no longer available for this item. Please update your cart.`,
          item,
          product,
        })
      )
      continue
    }

    if (
      !isModifierOptionAvailableForVariant({
        selectedVariantId,
        modifierGroupId: configuredGroup.id,
        modifierOptionId: effectiveOption.id,
        product,
      })
    ) {
      errors.push(
        buildModifierError({
          code: "unavailable_modifier_option",
          message: `${effectiveOption.name} is no longer available for this item. Please update your cart.`,
          item,
          product,
        })
      )
      continue
    }

    if (
      !isValidPlacement({
        group: configuredGroup,
        placement: modifier.placement,
      })
    ) {
      errors.push(
        buildModifierError({
          code: "invalid_modifier_placement",
          message: `${configuredGroup.name} does not support that placement.`,
          item,
          product,
        })
      )
      continue
    }

    if (
      !isValidMultiplier({
        group: configuredGroup,
        multiplier: modifier.multiplier,
      })
    ) {
      errors.push(
        buildModifierError({
          code: "invalid_modifier_multiplier",
          message: `${configuredGroup.name} does not support that multiplier.`,
          item,
          product,
        })
      )
      continue
    }

    validatedModifiers.push({
      optionId: effectiveOption.id,
      optionName: effectiveOption.name,
      groupId: configuredGroup.id,
      groupName: configuredGroup.name,
      placement: modifier.placement,
      multiplier: modifier.multiplier,
      priceDelta: effectiveOption.priceDelta,
    })
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    }
  }

  for (const group of activeGroups) {
    const availableOptions = getAvailableModifierOptions({
      group,
      product,
      selectedVariantId,
      overridesByOptionId,
      variantPriceOverrides,
    })
    const selectedCount = validatedModifiers.filter(
      (modifier) => modifier.groupId === group.id
    ).length

    if (group.isRequired && group.minRequired > 0 && availableOptions.length === 0) {
      errors.push(
        buildModifierError({
          code: "missing_required_modifier",
          message: `${group.name} has no available options right now.`,
          item,
          product,
        })
      )
      continue
    }

    if (group.isRequired && selectedCount < group.minRequired) {
      errors.push(
        buildModifierError({
          code: "missing_required_modifier",
          message: `Please choose at least ${group.minRequired} from ${group.name}.`,
          item,
          product,
        })
      )
    }

    if (group.maxAllowed !== null && selectedCount > group.maxAllowed) {
      errors.push(
        buildModifierError({
          code: "too_many_modifiers",
          message: `Please choose no more than ${group.maxAllowed} from ${group.name}.`,
          item,
          product,
        })
      )
    }
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    }
  }

  const selectedModifiers = Object.fromEntries(
    validatedModifiers.map((modifier) => [
      modifier.optionId,
      {
        optionId: modifier.optionId,
        placement: modifier.placement,
        multiplier: modifier.multiplier,
      },
    ])
  )
  const pricingGroups = activeGroups.map((group) => ({
    id: group.id,
    included_quantity: group.includedQuantity,
    charge_for_extra: group.chargeForExtra,
    modifier_options: getAvailableModifierOptions({
      group,
      product,
      selectedVariantId,
      overridesByOptionId,
      variantPriceOverrides,
    }).map((option) => ({
      id: option.id,
      price_delta: option.priceDelta,
    })),
  }))

  const pricing = priceConfiguredProduct({
    productBasePrice: basePrice,
    builderTemplate: product.builderTemplate,
    pricingSettings: product.pricingSettings,
    selectedModifiers,
    modifierGroups: pricingGroups,
    productDefaultModifierOptions: product.productDefaultModifierOptions,
  })

  return {
    ok: true,
    modifiers: validatedModifiers.map((modifier) => ({
      ...modifier,
      priceDelta:
        pricing.pricedSelectedModifiers[modifier.optionId]?.priceDelta ??
        modifier.priceDelta,
    })),
    unitPrice: pricing.unitPrice,
  }
}

export function validateAndPriceCart({
  items,
  products,
}: ValidateAndPriceCartInput): ValidateAndPriceCartResult {
  if (items.length === 0) {
    return {
      ok: false,
      cart: null,
      errors: [
        {
          code: "empty_cart",
          message: "Cart is empty.",
        },
      ],
    }
  }

  const productsById = getProductsById(products)
  const errors: CheckoutValidationError[] = []
  const validatedItems: ValidatedPricedCartItem[] = []

  for (const item of items) {
    const product = productsById.get(item.productId)

    if (!product) {
      errors.push({
        code: "missing_product",
        message: "A product in your cart is no longer available.",
        cartItemId: item.cartItemId,
        productId: item.productId,
      })
      continue
    }

    if (!product.isEnabled) {
      errors.push({
        code: product.isSoldOut ? "sold_out_product" : "disabled_product",
        message: product.isSoldOut
          ? `${product.name} is currently sold out.`
          : `${product.name} is no longer available.`,
        cartItemId: item.cartItemId,
        productId: item.productId,
      })
      continue
    }

    if (!isValidQuantity(item.quantity)) {
      errors.push({
        code: "invalid_quantity",
        message: `${product.name} has an invalid quantity.`,
        cartItemId: item.cartItemId,
        productId: item.productId,
      })
      continue
    }

    const variant = validateVariant({ item, product })

    if (!variant.ok) {
      errors.push(variant.error)
      continue
    }

    const modifiers = validateModifiers({
      item,
      product,
      selectedVariantId: variant.variantId,
      basePrice: variant.basePrice,
    })

    if (!modifiers.ok) {
      errors.push(...modifiers.errors)
      continue
    }

    const unitPrice = roundCurrency(modifiers.unitPrice)
    const lineSubtotal = roundCurrency(unitPrice * item.quantity)

    validatedItems.push({
      cartItemId: item.cartItemId,
      productId: product.id,
      productName: product.name,
      variantId: variant.variantId,
      variantName: variant.variantName,
      quantity: item.quantity,
      unitPrice,
      lineSubtotal,
      modifiers: modifiers.modifiers,
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
      subtotal: roundCurrency(
        validatedItems.reduce((sum, item) => sum + item.lineSubtotal, 0)
      ),
    },
    errors: [],
  }
}
