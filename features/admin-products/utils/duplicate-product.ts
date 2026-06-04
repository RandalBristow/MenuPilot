import { createSlug } from "@/features/admin-products/utils/build-product-payload"

export type DuplicateProductInput = {
  productId: string
  newName: string
  copyImage: boolean
  isEnabled: boolean
}

export type DuplicateProductRecord = {
  id: string
  business_id: string
  name: string
  description: string | null
  base_price: number | null
  sku: string | null
  image_media_id: string | null
  builder_template: string
  has_variants: boolean
  prep_time_minutes: number
  prep_time_type: string
  is_taxable: boolean
  is_featured: boolean
}

export type NewProductRecord = {
  business_id: string
  name: string
  slug: string
  description: string | null
  base_price: number | null
  sku: string | null
  image_media_id: string | null
  builder_template: string
  has_variants: boolean
  prep_time_minutes: number
  prep_time_type: string
  is_enabled: boolean
  is_taxable: boolean
  is_featured: boolean
}

export type ProductGroupCopyRecord = {
  business_id: string
  product_id: string
  menu_group_id: string
  is_primary: boolean
  sort_order: number
}

export type ProductVariantGroupCopyRecord = {
  business_id: string
  product_id: string
  variant_group_id: string
  is_enabled: boolean
  sort_order: number
}

export type ProductVariantOptionOverrideCopyRecord = {
  business_id: string
  product_id: string
  variant_group_option_id: string
  price_override: number | null
  prep_time_minutes_override: number | null
  is_enabled: boolean | null
  is_default: boolean | null
  sort_order: number | null
}

export type ProductModifierGroupCopyRecord = {
  business_id: string
  product_id: string
  modifier_group_id: string
  is_enabled: boolean
  sort_order: number
}

export type ProductModifierOptionOverrideCopyRecord = {
  business_id: string
  product_id: string
  modifier_option_id: string
  price_delta_override: number | null
  prep_time_delta_minutes_override: number | null
  is_enabled: boolean | null
  sort_order: number | null
}

export type ProductDefaultModifierOptionCopyRecord = {
  business_id: string
  product_id: string
  modifier_group_id: string
  modifier_option_id: string
  quantity: number
  is_removable: boolean
  placement: "left" | "whole" | "right"
  multiplier: number
  is_enabled: boolean
  sort_order: number
}

export type ProductIncludedModifierGroupCopyRecord = {
  business_id: string
  product_id: string
  modifier_group_id: string
  included_quantity: number
  is_swappable: boolean
  charge_for_extra: boolean
}

export type ProductVariantModifierOptionAvailabilityRuleCopyRecord = {
  business_id: string
  product_id: string
  variant_group_option_id: string
  modifier_group_id: string
  modifier_option_id: string
  is_available: boolean
  is_enabled: boolean
}

export type ProductVariantModifierOptionPriceOverrideCopyRecord = {
  business_id: string
  product_id: string
  variant_group_option_id: string
  modifier_group_id: string
  modifier_option_id: string
  price_delta: number
  is_enabled: boolean
}

export type ProductDuplicateStore = {
  findProduct: (productId: string) => Promise<DuplicateProductRecord | null>
  createProduct: (product: NewProductRecord) => Promise<{ id: string }>
  deleteProduct: (productId: string) => Promise<void>
  getNextProductGroupSortOrder: (input: {
    businessId: string
    menuGroupId: string
  }) => Promise<number>
  listProductGroups: (productId: string) => Promise<ProductGroupCopyRecord[]>
  insertProductGroups: (records: ProductGroupCopyRecord[]) => Promise<void>
  listProductVariantGroups: (
    productId: string
  ) => Promise<ProductVariantGroupCopyRecord[]>
  insertProductVariantGroups: (
    records: ProductVariantGroupCopyRecord[]
  ) => Promise<void>
  listProductVariantOptionOverrides: (
    productId: string
  ) => Promise<ProductVariantOptionOverrideCopyRecord[]>
  insertProductVariantOptionOverrides: (
    records: ProductVariantOptionOverrideCopyRecord[]
  ) => Promise<void>
  listProductModifierGroups: (
    productId: string
  ) => Promise<ProductModifierGroupCopyRecord[]>
  insertProductModifierGroups: (
    records: ProductModifierGroupCopyRecord[]
  ) => Promise<void>
  listProductModifierOptionOverrides: (
    productId: string
  ) => Promise<ProductModifierOptionOverrideCopyRecord[]>
  insertProductModifierOptionOverrides: (
    records: ProductModifierOptionOverrideCopyRecord[]
  ) => Promise<void>
  listProductDefaultModifierOptions: (
    productId: string
  ) => Promise<ProductDefaultModifierOptionCopyRecord[]>
  insertProductDefaultModifierOptions: (
    records: ProductDefaultModifierOptionCopyRecord[]
  ) => Promise<void>
  listProductIncludedModifierGroups: (
    productId: string
  ) => Promise<ProductIncludedModifierGroupCopyRecord[]>
  insertProductIncludedModifierGroups: (
    records: ProductIncludedModifierGroupCopyRecord[]
  ) => Promise<void>
  listProductVariantModifierOptionAvailabilityRules: (
    productId: string
  ) => Promise<ProductVariantModifierOptionAvailabilityRuleCopyRecord[]>
  insertProductVariantModifierOptionAvailabilityRules: (
    records: ProductVariantModifierOptionAvailabilityRuleCopyRecord[]
  ) => Promise<void>
  listProductVariantModifierOptionPriceOverrides: (
    productId: string
  ) => Promise<ProductVariantModifierOptionPriceOverrideCopyRecord[]>
  insertProductVariantModifierOptionPriceOverrides: (
    records: ProductVariantModifierOptionPriceOverrideCopyRecord[]
  ) => Promise<void>
}

export type DuplicateProductResult =
  | {
      status: "duplicated"
      productId: string
      message: string
    }
  | {
      status: "error"
      message: string
    }

function parseDuplicateName(name: string) {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error("New product name is required.")
  }

  return trimmedName
}

async function copyProductGroups({
  originalProductId,
  newProductId,
  store,
}: {
  originalProductId: string
  newProductId: string
  store: ProductDuplicateStore
}) {
  const groups = await store.listProductGroups(originalProductId)
  const copiedGroups = await Promise.all(
    groups.map(async (group) => ({
      ...group,
      product_id: newProductId,
      sort_order: await store.getNextProductGroupSortOrder({
        businessId: group.business_id,
        menuGroupId: group.menu_group_id,
      }),
    }))
  )

  await store.insertProductGroups(copiedGroups)
}

async function copyRows<TRecord extends { product_id: string }>({
  originalProductId,
  newProductId,
  list,
  insert,
}: {
  originalProductId: string
  newProductId: string
  list: (productId: string) => Promise<TRecord[]>
  insert: (records: TRecord[]) => Promise<void>
}) {
  const records = await list(originalProductId)

  await insert(
    records.map((record) => ({
      ...record,
      product_id: newProductId,
    }))
  )
}

export async function duplicateProductSetup({
  input,
  store,
}: {
  input: DuplicateProductInput
  store: ProductDuplicateStore
}): Promise<DuplicateProductResult> {
  try {
    const newName = parseDuplicateName(input.newName)
    const originalProduct = await store.findProduct(input.productId)

    if (!originalProduct) {
      throw new Error("Product could not be found.")
    }

    const newProduct = await store.createProduct({
      business_id: originalProduct.business_id,
      name: newName,
      slug: createSlug(newName),
      description: originalProduct.description,
      base_price: originalProduct.base_price,
      sku: null,
      image_media_id: input.copyImage ? originalProduct.image_media_id : null,
      builder_template: originalProduct.builder_template,
      has_variants: originalProduct.has_variants,
      prep_time_minutes: originalProduct.prep_time_minutes,
      prep_time_type: originalProduct.prep_time_type,
      is_enabled: input.isEnabled,
      is_taxable: originalProduct.is_taxable,
      is_featured: originalProduct.is_featured,
    })

    try {
      await copyProductGroups({
        originalProductId: originalProduct.id,
        newProductId: newProduct.id,
        store,
      })
      await copyRows({
        originalProductId: originalProduct.id,
        newProductId: newProduct.id,
        list: store.listProductVariantGroups,
        insert: store.insertProductVariantGroups,
      })
      await copyRows({
        originalProductId: originalProduct.id,
        newProductId: newProduct.id,
        list: store.listProductVariantOptionOverrides,
        insert: store.insertProductVariantOptionOverrides,
      })
      await copyRows({
        originalProductId: originalProduct.id,
        newProductId: newProduct.id,
        list: store.listProductModifierGroups,
        insert: store.insertProductModifierGroups,
      })
      await copyRows({
        originalProductId: originalProduct.id,
        newProductId: newProduct.id,
        list: store.listProductModifierOptionOverrides,
        insert: store.insertProductModifierOptionOverrides,
      })
      await copyRows({
        originalProductId: originalProduct.id,
        newProductId: newProduct.id,
        list: store.listProductDefaultModifierOptions,
        insert: store.insertProductDefaultModifierOptions,
      })
      await copyRows({
        originalProductId: originalProduct.id,
        newProductId: newProduct.id,
        list: store.listProductIncludedModifierGroups,
        insert: store.insertProductIncludedModifierGroups,
      })
      await copyRows({
        originalProductId: originalProduct.id,
        newProductId: newProduct.id,
        list: store.listProductVariantModifierOptionAvailabilityRules,
        insert: store.insertProductVariantModifierOptionAvailabilityRules,
      })
      await copyRows({
        originalProductId: originalProduct.id,
        newProductId: newProduct.id,
        list: store.listProductVariantModifierOptionPriceOverrides,
        insert: store.insertProductVariantModifierOptionPriceOverrides,
      })
    } catch (error) {
      await store.deleteProduct(newProduct.id)
      throw error
    }

    return {
      status: "duplicated",
      productId: newProduct.id,
      message: "Product duplicated.",
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Product could not be duplicated. Please try again.",
    }
  }
}
