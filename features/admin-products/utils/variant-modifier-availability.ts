export type VariantModifierOptionAvailabilityRule = {
  id: string
  variant_group_option_id: string
  modifier_group_id: string
  modifier_option_id: string
  is_available: boolean
  is_enabled: boolean
}

export function isModifierOptionAvailableForVariant({
  selectedVariantOptionId,
  modifierGroupId,
  modifierOptionId,
  availabilityRules,
}: {
  selectedVariantOptionId: string
  modifierGroupId: string
  modifierOptionId: string
  availabilityRules: VariantModifierOptionAvailabilityRule[]
}) {
  const rule = availabilityRules.find(
    (item) =>
      item.is_enabled &&
      item.variant_group_option_id === selectedVariantOptionId &&
      item.modifier_group_id === modifierGroupId &&
      item.modifier_option_id === modifierOptionId
  )

  return rule?.is_available ?? true
}

export function buildVariantModifierAvailabilityRulePayload({
  businessId,
  productId,
  variantGroupOptionId,
  modifierGroupId,
  modifierOptionId,
}: {
  businessId: string
  productId: string
  variantGroupOptionId: string
  modifierGroupId: string
  modifierOptionId: string
}) {
  return {
    business_id: businessId,
    product_id: productId,
    variant_group_option_id: variantGroupOptionId,
    modifier_group_id: modifierGroupId,
    modifier_option_id: modifierOptionId,
    is_available: false,
    is_enabled: true,
  }
}

export function buildVariantModifierPriceOverridePayload({
  businessId,
  productId,
  variantGroupOptionId,
  modifierGroupId,
  modifierOptionId,
  priceDelta,
}: {
  businessId: string
  productId: string
  variantGroupOptionId: string
  modifierGroupId: string
  modifierOptionId: string
  priceDelta: number
}) {
  return {
    business_id: businessId,
    product_id: productId,
    variant_group_option_id: variantGroupOptionId,
    modifier_group_id: modifierGroupId,
    modifier_option_id: modifierOptionId,
    price_delta: priceDelta,
    is_enabled: true,
  }
}
