export type ConfiguratorProductVariant = {
  is_enabled: boolean
  sort_order: number
}

export type VariantProduct = {
  has_variants: boolean
  product_variants?: ConfiguratorProductVariant[] | null
}

export function filterEnabledProductVariants<T extends ConfiguratorProductVariant>(
  variants: T[] | null | undefined
) {
  return [...(variants ?? [])]
    .filter((variant) => variant.is_enabled)
    .sort((first, second) => first.sort_order - second.sort_order)
}

export function isVariantProductUnavailable(product: VariantProduct) {
  return (
    product.has_variants &&
    filterEnabledProductVariants(product.product_variants).length === 0
  )
}
