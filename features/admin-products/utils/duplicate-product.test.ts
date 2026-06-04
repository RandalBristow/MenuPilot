import { describe, expect, it } from "vitest"
import {
  duplicateProductSetup,
  type DuplicateProductRecord,
  type NewProductRecord,
  type ProductDefaultModifierOptionCopyRecord,
  type ProductDuplicateStore,
  type ProductGroupCopyRecord,
  type ProductIncludedModifierGroupCopyRecord,
  type ProductModifierGroupCopyRecord,
  type ProductModifierOptionOverrideCopyRecord,
  type ProductVariantGroupCopyRecord,
  type ProductVariantModifierOptionAvailabilityRuleCopyRecord,
  type ProductVariantModifierOptionPriceOverrideCopyRecord,
  type ProductVariantOptionOverrideCopyRecord,
} from "./duplicate-product"

type InsertedRows = {
  products: Array<NewProductRecord & { id: string }>
  productGroups: ProductGroupCopyRecord[]
  variantGroups: ProductVariantGroupCopyRecord[]
  variantOverrides: ProductVariantOptionOverrideCopyRecord[]
  modifierGroups: ProductModifierGroupCopyRecord[]
  modifierOverrides: ProductModifierOptionOverrideCopyRecord[]
  defaults: ProductDefaultModifierOptionCopyRecord[]
  included: ProductIncludedModifierGroupCopyRecord[]
  availability: ProductVariantModifierOptionAvailabilityRuleCopyRecord[]
  priceOverrides: ProductVariantModifierOptionPriceOverrideCopyRecord[]
  deletedProducts: string[]
}

const originalProduct: DuplicateProductRecord = {
  id: "meat-pizza",
  business_id: "business-1",
  name: "Meat Pizza",
  description: "Loaded with meats.",
  base_price: 14.99,
  sku: "MEAT-PIZZA",
  image_media_id: "media-meat",
  builder_template: "pizza",
  has_variants: true,
  prep_time_minutes: 18,
  prep_time_type: "fixed",
  is_taxable: true,
  is_featured: true,
}

function createRows() {
  return {
    productGroups: [
      {
        business_id: "business-1",
        product_id: "meat-pizza",
        menu_group_id: "specialty-pizzas",
        is_primary: true,
        sort_order: 2,
      },
    ],
    variantGroups: [
      {
        business_id: "business-1",
        product_id: "meat-pizza",
        variant_group_id: "pizza-sizes",
        is_enabled: true,
        sort_order: 1,
      },
    ],
    variantOverrides: [
      {
        business_id: "business-1",
        product_id: "meat-pizza",
        variant_group_option_id: "large",
        price_override: 18.99,
        prep_time_minutes_override: 2,
        is_enabled: true,
        is_default: false,
        sort_order: 2,
      },
    ],
    modifierGroups: [
      {
        business_id: "business-1",
        product_id: "meat-pizza",
        modifier_group_id: "pizza-toppings",
        is_enabled: true,
        sort_order: 4,
      },
    ],
    modifierOverrides: [
      {
        business_id: "business-1",
        product_id: "meat-pizza",
        modifier_option_id: "pepperoni",
        price_delta_override: 0,
        prep_time_delta_minutes_override: null,
        is_enabled: true,
        sort_order: 1,
      },
    ],
    defaults: [
      {
        business_id: "business-1",
        product_id: "meat-pizza",
        modifier_group_id: "pizza-toppings",
        modifier_option_id: "pepperoni",
        quantity: 1,
        is_removable: true,
        placement: "whole" as const,
        multiplier: 1,
        is_enabled: true,
        sort_order: 1,
      },
    ],
    included: [
      {
        business_id: "business-1",
        product_id: "meat-pizza",
        modifier_group_id: "pizza-toppings",
        included_quantity: 2,
        is_swappable: true,
        charge_for_extra: true,
      },
    ],
    availability: [
      {
        business_id: "business-1",
        product_id: "meat-pizza",
        variant_group_option_id: "small",
        modifier_group_id: "pizza-toppings",
        modifier_option_id: "bacon",
        is_available: false,
        is_enabled: true,
      },
    ],
    priceOverrides: [
      {
        business_id: "business-1",
        product_id: "meat-pizza",
        variant_group_option_id: "large",
        modifier_group_id: "pizza-toppings",
        modifier_option_id: "bacon",
        price_delta: 2,
        is_enabled: true,
      },
    ],
  }
}

function createStore() {
  const sourceRows = createRows()
  const inserted: InsertedRows = {
    products: [],
    productGroups: [],
    variantGroups: [],
    variantOverrides: [],
    modifierGroups: [],
    modifierOverrides: [],
    defaults: [],
    included: [],
    availability: [],
    priceOverrides: [],
    deletedProducts: [],
  }
  const store: ProductDuplicateStore = {
    async findProduct(productId) {
      return productId === originalProduct.id ? originalProduct : null
    },
    async createProduct(product) {
      const nextProduct = {
        ...product,
        id: "the-works",
      }
      inserted.products.push(nextProduct)
      return { id: nextProduct.id }
    },
    async deleteProduct(productId) {
      inserted.deletedProducts.push(productId)
    },
    async getNextProductGroupSortOrder() {
      return 9
    },
    async listProductGroups() {
      return sourceRows.productGroups
    },
    async insertProductGroups(records) {
      inserted.productGroups.push(...records)
    },
    async listProductVariantGroups() {
      return sourceRows.variantGroups
    },
    async insertProductVariantGroups(records) {
      inserted.variantGroups.push(...records)
    },
    async listProductVariantOptionOverrides() {
      return sourceRows.variantOverrides
    },
    async insertProductVariantOptionOverrides(records) {
      inserted.variantOverrides.push(...records)
    },
    async listProductModifierGroups() {
      return sourceRows.modifierGroups
    },
    async insertProductModifierGroups(records) {
      inserted.modifierGroups.push(...records)
    },
    async listProductModifierOptionOverrides() {
      return sourceRows.modifierOverrides
    },
    async insertProductModifierOptionOverrides(records) {
      inserted.modifierOverrides.push(...records)
    },
    async listProductDefaultModifierOptions() {
      return sourceRows.defaults
    },
    async insertProductDefaultModifierOptions(records) {
      inserted.defaults.push(...records)
    },
    async listProductIncludedModifierGroups() {
      return sourceRows.included
    },
    async insertProductIncludedModifierGroups(records) {
      inserted.included.push(...records)
    },
    async listProductVariantModifierOptionAvailabilityRules() {
      return sourceRows.availability
    },
    async insertProductVariantModifierOptionAvailabilityRules(records) {
      inserted.availability.push(...records)
    },
    async listProductVariantModifierOptionPriceOverrides() {
      return sourceRows.priceOverrides
    },
    async insertProductVariantModifierOptionPriceOverrides(records) {
      inserted.priceOverrides.push(...records)
    },
  }

  return { store, inserted }
}

async function duplicateWithDefaults(store: ProductDuplicateStore) {
  return duplicateProductSetup({
    input: {
      productId: "meat-pizza",
      newName: "The Works",
      copyImage: true,
      isEnabled: false,
    },
    store,
  })
}

describe("duplicateProductSetup", () => {
  it("duplicate creates a new product with a new id", async () => {
    const { store, inserted } = createStore()

    const result = await duplicateWithDefaults(store)

    expect(result).toMatchObject({
      status: "duplicated",
      productId: "the-works",
    })
    expect(inserted.products[0].id).not.toBe(originalProduct.id)
  })

  it("duplicate uses the provided new name", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect(inserted.products[0].name).toBe("The Works")
    expect(inserted.products[0].slug).toBe("the-works")
  })

  it("duplicated product is disabled by default unless explicitly enabled", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect(inserted.products[0].is_enabled).toBe(false)
  })

  it("can duplicate as enabled when explicitly requested", async () => {
    const { store, inserted } = createStore()

    await duplicateProductSetup({
      input: {
        productId: "meat-pizza",
        newName: "Live Copy",
        copyImage: true,
        isEnabled: true,
      },
      store,
    })

    expect(inserted.products[0].is_enabled).toBe(true)
  })

  it("duplicate copies category, builder, base price, and description", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect(inserted.products[0]).toMatchObject({
      business_id: "business-1",
      description: "Loaded with meats.",
      base_price: 14.99,
      builder_template: "pizza",
      has_variants: true,
      image_media_id: "media-meat",
    })
    expect(inserted.productGroups[0]).toMatchObject({
      product_id: "the-works",
      menu_group_id: "specialty-pizzas",
      sort_order: 9,
    })
  })

  it("can duplicate without copying the image", async () => {
    const { store, inserted } = createStore()

    await duplicateProductSetup({
      input: {
        productId: "meat-pizza",
        newName: "No Image Copy",
        copyImage: false,
        isEnabled: false,
      },
      store,
    })

    expect(inserted.products[0].image_media_id).toBeNull()
  })

  it("duplicate copies variant setup", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect(inserted.variantGroups[0]).toMatchObject({
      product_id: "the-works",
      variant_group_id: "pizza-sizes",
    })
    expect(inserted.variantOverrides[0]).toMatchObject({
      product_id: "the-works",
      variant_group_option_id: "large",
      price_override: 18.99,
    })
  })

  it("duplicate copies modifier setup", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect(inserted.modifierGroups[0]).toMatchObject({
      product_id: "the-works",
      modifier_group_id: "pizza-toppings",
    })
    expect(inserted.modifierOverrides[0]).toMatchObject({
      product_id: "the-works",
      modifier_option_id: "pepperoni",
      price_delta_override: 0,
    })
  })

  it("duplicate copies default modifiers and included modifier group rules", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect(inserted.defaults[0]).toMatchObject({
      product_id: "the-works",
      modifier_option_id: "pepperoni",
      placement: "whole",
    })
    expect(inserted.included[0]).toMatchObject({
      product_id: "the-works",
      modifier_group_id: "pizza-toppings",
      included_quantity: 2,
    })
  })

  it("duplicate copies variant availability and variant-specific modifier price overrides", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect(inserted.availability[0]).toMatchObject({
      product_id: "the-works",
      variant_group_option_id: "small",
      modifier_option_id: "bacon",
      is_available: false,
    })
    expect(inserted.priceOverrides[0]).toMatchObject({
      product_id: "the-works",
      variant_group_option_id: "large",
      modifier_option_id: "bacon",
      price_delta: 2,
    })
  })

  it("duplicate does not copy orders or order items", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect(Object.keys(inserted)).not.toContain("orders")
    expect(Object.keys(inserted)).not.toContain("orderItems")
  })

  it("duplicate reuses global variant, modifier, and media records instead of duplicating them", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect(inserted.variantGroups[0].variant_group_id).toBe("pizza-sizes")
    expect(inserted.modifierGroups[0].modifier_group_id).toBe("pizza-toppings")
    expect(inserted.modifierOverrides[0].modifier_option_id).toBe("pepperoni")
    expect(inserted.products[0].image_media_id).toBe("media-meat")
  })

  it("duplicate rows point to the new product_id", async () => {
    const { store, inserted } = createStore()

    await duplicateWithDefaults(store)

    expect([
      inserted.productGroups[0].product_id,
      inserted.variantGroups[0].product_id,
      inserted.variantOverrides[0].product_id,
      inserted.modifierGroups[0].product_id,
      inserted.modifierOverrides[0].product_id,
      inserted.defaults[0].product_id,
      inserted.included[0].product_id,
      inserted.availability[0].product_id,
      inserted.priceOverrides[0].product_id,
    ]).toEqual(Array(9).fill("the-works"))
  })

  it("returns a friendly validation message when duplicate name is blank", async () => {
    const { store } = createStore()

    const result = await duplicateProductSetup({
      input: {
        productId: "meat-pizza",
        newName: "   ",
        copyImage: true,
        isEnabled: false,
      },
      store,
    })

    expect(result).toEqual({
      status: "error",
      message: "New product name is required.",
    })
  })

  it("removes the new product if relationship copy fails", async () => {
    const { store, inserted } = createStore()
    const failingStore: ProductDuplicateStore = {
      ...store,
      async insertProductModifierGroups() {
        throw new Error("Could not copy modifier group assignments.")
      },
    }

    const result = await duplicateWithDefaults(failingStore)

    expect(result).toEqual({
      status: "error",
      message: "Could not copy modifier group assignments.",
    })
    expect(inserted.deletedProducts).toEqual(["the-works"])
  })
})
