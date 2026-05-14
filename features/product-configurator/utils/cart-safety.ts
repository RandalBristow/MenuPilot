export type CartSafetyVariant = {
  id: string
  is_default: boolean
}

export type CartSafetySelectedModifier = {
  optionId: string
}

export type CartSafetyModifierGroup = {
  modifier_options: {
    id: string
  }[]
}

export function getSafeInitialVariantId(
  variants: CartSafetyVariant[],
  cartVariantId?: string | null
) {
  if (cartVariantId && variants.some((variant) => variant.id === cartVariantId)) {
    return cartVariantId
  }

  return variants.find((variant) => variant.is_default)?.id ?? variants[0]?.id ?? ""
}

export function getResolvableSelectedModifiers<T extends CartSafetySelectedModifier>(
  selectedModifiers: T[],
  modifierGroups: CartSafetyModifierGroup[]
) {
  return selectedModifiers.filter((selected) =>
    modifierGroups.some((group) =>
      group.modifier_options.some((option) => option.id === selected.optionId)
    )
  )
}
