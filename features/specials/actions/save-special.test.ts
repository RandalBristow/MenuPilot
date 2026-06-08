import { beforeEach, describe, expect, it, vi } from "vitest"
import { saveSpecial } from "./save-special"
import { setSpecialEnabled } from "./set-special-enabled"

type QueryResult = {
  data: unknown
  error: { message: string } | null
}

const dbMock = vi.hoisted(() => ({
  business: { id: "business-a", slug: "randys-pizza" },
  products: [{ id: "product-a" }],
  menuGroups: [{ id: "menu-group-a" }],
  variantOptions: [{ id: "variant-large", variant_group_id: "variant-group-a" }],
  productVariantGroups: [
    { product_id: "product-a", variant_group_id: "variant-group-a" },
  ],
  modifierGroups: [{ id: "modifier-toppings" }],
  productModifierGroups: [
    { product_id: "product-a", modifier_group_id: "modifier-toppings" },
  ],
  specialComponents: [] as Array<{ id: string }>,
  specialExists: true,
  insertedSpecialId: "special-new",
  insertedComponentIds: ["component-new"] as string[],
  insertedComponentProductIds: ["component-product-new"] as string[],
  insertedMixProductIds: ["mix-product-new"] as string[],
  operations: [] as Array<{
    table: string
    operation: string
    payload?: unknown
    filters: Array<{ column: string; value: unknown }>
  }>,
  revalidatedPaths: [] as string[],
  redirectedTo: null as string | null,
}))

class MockQuery {
  private operation = "select"
  private payload: unknown
  private filters: Array<{ column: string; value: unknown }> = []

  constructor(private table: string) {}

  select() {
    return this
  }

  insert(payload: unknown) {
    this.operation = "insert"
    this.payload = payload
    return this
  }

  update(payload: unknown) {
    this.operation = "update"
    this.payload = payload
    return this
  }

  delete() {
    this.operation = "delete"
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  in(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  single(): Promise<QueryResult> {
    this.record()

    if (this.table === "businesses") {
      return Promise.resolve({ data: dbMock.business, error: null })
    }

    if (this.table === "specials" && this.operation === "insert") {
      return Promise.resolve({
        data: { id: dbMock.insertedSpecialId },
        error: null,
      })
    }

    if (this.table === "special_components" && this.operation === "insert") {
      return Promise.resolve({
        data: { id: dbMock.insertedComponentIds.shift() ?? "component-new" },
        error: null,
      })
    }

    if (
      this.table === "special_component_products" &&
      this.operation === "insert"
    ) {
      return Promise.resolve({
        data: {
          id:
            dbMock.insertedComponentProductIds.shift() ??
            "component-product-new",
        },
        error: null,
      })
    }

    if (
      this.table === "special_mix_match_products" &&
      this.operation === "insert"
    ) {
      return Promise.resolve({
        data: {
          id: dbMock.insertedMixProductIds.shift() ?? "mix-product-new",
        },
        error: null,
      })
    }

    if (this.table === "specials" && !dbMock.specialExists) {
      return Promise.resolve({
        data: null,
        error: { message: "not found" },
      })
    }

    return Promise.resolve({ data: { id: "special-a" }, error: null })
  }

  then(resolve: (value: QueryResult) => void) {
    this.record()

    if (this.table === "products") {
      resolve({ data: dbMock.products, error: null })
      return
    }

    if (this.table === "menu_groups") {
      resolve({ data: dbMock.menuGroups, error: null })
      return
    }

    if (this.table === "variant_group_options") {
      resolve({ data: dbMock.variantOptions, error: null })
      return
    }

    if (this.table === "product_variant_groups") {
      resolve({ data: dbMock.productVariantGroups, error: null })
      return
    }

    if (this.table === "modifier_groups") {
      resolve({ data: dbMock.modifierGroups, error: null })
      return
    }

    if (this.table === "product_modifier_groups") {
      resolve({ data: dbMock.productModifierGroups, error: null })
      return
    }

    if (this.table === "special_components") {
      resolve({ data: dbMock.specialComponents, error: null })
      return
    }

    resolve({ data: null, error: null })
  }

  private record() {
    dbMock.operations.push({
      table: this.table,
      operation: this.operation,
      payload: this.payload,
      filters: this.filters,
    })
  }
}

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: (table: string) => new MockQuery(table),
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    dbMock.revalidatedPaths.push(path)
  },
}))

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    dbMock.redirectedTo = path
    throw new Error(`NEXT_REDIRECT:${path}`)
  },
}))

function buildFormData(overrides: Record<string, string | string[]> = {}) {
  const formData = new FormData()
  const defaults: Record<string, string | string[]> = {
    businessSlug: "randys-pizza",
    name: "Family Night",
    description: "Internal note",
    customerDescription: "Customer note",
    specialType: "cart_discount",
    discountType: "fixed_amount",
    discountValue: "5",
    minOrderAmount: "20",
    isEnabled: "false",
    startsAt: "",
    endsAt: "",
    availabilityMode: "always",
  }

  Object.entries({ ...defaults, ...overrides }).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item))
      return
    }

    formData.set(key, value)
  })

  return formData
}

describe("special admin actions", () => {
  beforeEach(() => {
    dbMock.products = [{ id: "product-a" }]
    dbMock.menuGroups = [{ id: "menu-group-a" }]
    dbMock.variantOptions = [
      { id: "variant-large", variant_group_id: "variant-group-a" },
    ]
    dbMock.productVariantGroups = [
      { product_id: "product-a", variant_group_id: "variant-group-a" },
    ]
    dbMock.modifierGroups = [{ id: "modifier-toppings" }]
    dbMock.productModifierGroups = [
      { product_id: "product-a", modifier_group_id: "modifier-toppings" },
    ]
    dbMock.specialComponents = []
    dbMock.specialExists = true
    dbMock.insertedComponentIds = ["component-new"]
    dbMock.insertedComponentProductIds = ["component-product-new"]
    dbMock.insertedMixProductIds = ["mix-product-new"]
    dbMock.operations = []
    dbMock.revalidatedPaths = []
    dbMock.redirectedTo = null
  })

  it("creates a special with the resolved business id", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          productIds: ["product-a"],
          menuGroupIds: ["menu-group-a"],
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "specials" && operation.operation === "insert"
      )
    ).toMatchObject({
      payload: expect.objectContaining({
        business_id: "business-a",
        name: "Family Night",
      }),
    })
    expect(dbMock.redirectedTo).toBe("/businesses/randys-pizza/admin/specials")
  })

  it("creates an orderable deal with components and component products", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          specialType: "orderable_deal",
          discountType: "fixed_price",
          discountValue: "29.99",
          componentCount: "1",
          "componentLabel-0": "Choose a pizza",
          "componentDescription-0": "Any pizza",
          "componentSortOrder-0": "1",
          "componentRequiredQuantity-0": "1",
          "componentMinQuantity-0": "1",
          "componentMaxQuantity-0": "1",
          "componentProductIds-0": ["product-a"],
          "componentProductVariantOptionIds-0-product-a": ["variant-large"],
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "specials" && operation.operation === "insert"
      )
    ).toMatchObject({
      payload: expect.objectContaining({
        special_type: "orderable_deal",
        discount_type: "fixed_price",
        discount_value: 29.99,
        min_order_amount: null,
      }),
    })
    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_components" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: expect.objectContaining({
        business_id: "business-a",
        special_id: "special-new",
        label: "Choose a pizza",
        required_quantity: 1,
      }),
    })
    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_component_products" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: expect.objectContaining({
        business_id: "business-a",
        special_component_id: "component-new",
        product_id: "product-a",
      }),
    })
    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_component_product_variant_options" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: [
        expect.objectContaining({
          business_id: "business-a",
          special_component_product_id: "component-product-new",
          special_component_id: "component-new",
          product_id: "product-a",
          variant_group_option_id: "variant-large",
        }),
      ],
    })
  })

  it("saves orderable deal modifier included-count overrides", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          specialType: "orderable_deal",
          discountType: "fixed_price",
          discountValue: "29.99",
          componentCount: "1",
          "componentLabel-0": "Choose a pizza",
          "componentSortOrder-0": "1",
          "componentRequiredQuantity-0": "1",
          "componentMinQuantity-0": "1",
          "componentMaxQuantity-0": "1",
          "componentProductIds-0": ["product-a"],
          "componentModifierIncludedCount-0::product-a::modifier-toppings":
            "2",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_component_modifier_group_overrides" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: [
        expect.objectContaining({
          business_id: "business-a",
          special_component_id: "component-new",
          product_id: "product-a",
          modifier_group_id: "modifier-toppings",
          included_selection_count: 2,
        }),
      ],
    })
  })

  it("saves explicit zero deal modifier overrides", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          specialType: "orderable_deal",
          discountType: "fixed_price",
          discountValue: "29.99",
          componentCount: "1",
          "componentLabel-0": "Choose a pizza",
          "componentSortOrder-0": "1",
          "componentRequiredQuantity-0": "1",
          "componentMinQuantity-0": "1",
          "componentMaxQuantity-0": "1",
          "componentProductIds-0": ["product-a"],
          "componentModifierIncludedCount-0::product-a::modifier-toppings":
            "0",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_component_modifier_group_overrides" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: [
        expect.objectContaining({
          included_selection_count: 0,
        }),
      ],
    })
  })

  it("does not save blank deal modifier override rows", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          specialType: "orderable_deal",
          discountType: "fixed_price",
          discountValue: "29.99",
          componentCount: "1",
          "componentLabel-0": "Choose a pizza",
          "componentSortOrder-0": "1",
          "componentRequiredQuantity-0": "1",
          "componentMinQuantity-0": "1",
          "componentMaxQuantity-0": "1",
          "componentProductIds-0": ["product-a"],
          "componentModifierIncludedCount-0::product-a::modifier-toppings": "",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      dbMock.operations.some(
        (operation) =>
          operation.table === "special_component_modifier_group_overrides" &&
          operation.operation === "insert"
      )
    ).toBe(false)
  })

  it("creates a mix and match special with rule, pool products, variants, and modifier overrides", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          specialType: "mix_and_match_fixed_unit_price",
          discountType: "fixed_price",
          mixMinQuantity: "2",
          mixMaxQuantity: "4",
          mixUnitPrice: "7.99",
          mixAllowExtraItems: "true",
          mixProductIds: ["product-a"],
          "mixProductVariantOptionIds-product-a": ["variant-large"],
          "mixModifierIncludedCount::product-a::modifier-toppings": "2",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "specials" && operation.operation === "insert"
      )
    ).toMatchObject({
      payload: expect.objectContaining({
        special_type: "mix_and_match_fixed_unit_price",
        discount_type: "fixed_price",
        discount_value: 7.99,
        min_order_amount: null,
      }),
    })
    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_mix_match_rules" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: expect.objectContaining({
        business_id: "business-a",
        special_id: "special-new",
        min_quantity: 2,
        max_quantity: 4,
        unit_price: 7.99,
        allow_extra_items: true,
      }),
    })
    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_mix_match_products" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: expect.objectContaining({
        business_id: "business-a",
        special_id: "special-new",
        product_id: "product-a",
        sort_order: 1,
      }),
    })
    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_mix_match_product_variant_options" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: [
        expect.objectContaining({
          business_id: "business-a",
          special_id: "special-new",
          special_mix_match_product_id: "mix-product-new",
          product_id: "product-a",
          variant_group_option_id: "variant-large",
        }),
      ],
    })
    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_mix_match_modifier_group_overrides" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: [
        expect.objectContaining({
          business_id: "business-a",
          special_id: "special-new",
          special_mix_match_product_id: "mix-product-new",
          product_id: "product-a",
          modifier_group_id: "modifier-toppings",
          included_selection_count: 2,
        }),
      ],
    })
  })

  it("does not save blank mix modifier override rows", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          specialType: "mix_and_match_fixed_unit_price",
          discountType: "fixed_price",
          mixMinQuantity: "2",
          mixUnitPrice: "7.99",
          mixAllowExtraItems: "true",
          mixProductIds: ["product-a"],
          "mixModifierIncludedCount::product-a::modifier-toppings": "",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      dbMock.operations.some(
        (operation) =>
          operation.table === "special_mix_match_modifier_group_overrides" &&
          operation.operation === "insert"
      )
    ).toBe(false)
  })

  it("rejects invalid mix and match quantity and unit price rules", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          specialType: "mix_and_match_fixed_unit_price",
          discountType: "fixed_price",
          mixMinQuantity: "3",
          mixMaxQuantity: "2",
          mixUnitPrice: "7.99",
          mixProductIds: ["product-a"],
        })
      )
    ).rejects.toThrow("maximum quantity")

    await expect(
      saveSpecial(
        buildFormData({
          specialType: "mix_and_match_fixed_unit_price",
          discountType: "fixed_price",
          mixMinQuantity: "2",
          mixUnitPrice: "0",
          mixProductIds: ["product-a"],
        })
      )
    ).rejects.toThrow("unit price")
  })

  it("rejects cross-tenant mix pool products", async () => {
    dbMock.products = []

    await expect(
      saveSpecial(
        buildFormData({
          specialType: "mix_and_match_fixed_unit_price",
          discountType: "fixed_price",
          mixMinQuantity: "2",
          mixUnitPrice: "7.99",
          mixProductIds: ["product-b"],
        })
      )
    ).rejects.toThrow("selected products are invalid")
  })

  it("replaces existing orderable deal components on edit", async () => {
    dbMock.specialComponents = [{ id: "old-component" }]

    await expect(
      saveSpecial(
        buildFormData({
          specialId: "special-a",
          specialType: "orderable_deal",
          discountType: "fixed_price",
          discountValue: "20",
          componentCount: "1",
          "componentLabel-0": "Choose first pizza",
          "componentSortOrder-0": "1",
          "componentRequiredQuantity-0": "1",
          "componentMinQuantity-0": "1",
          "componentMaxQuantity-0": "1",
          "componentProductIds-0": ["product-a"],
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_components" &&
          operation.operation === "delete"
      )
    ).toBeTruthy()
    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_components" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: expect.objectContaining({
        special_id: "special-a",
        label: "Choose first pizza",
      }),
    })
  })

  it("rejects cross-tenant orderable deal component products", async () => {
    dbMock.products = []

    await expect(
      saveSpecial(
        buildFormData({
          specialType: "orderable_deal",
          discountType: "fixed_price",
          discountValue: "20",
          componentCount: "1",
          "componentLabel-0": "Choose a pizza",
          "componentSortOrder-0": "1",
          "componentRequiredQuantity-0": "1",
          "componentMinQuantity-0": "1",
          "componentMaxQuantity-0": "1",
          "componentProductIds-0": ["product-b"],
        })
      )
    ).rejects.toThrow("selected products are invalid")
  })

  it("rejects cross-business orderable deal component variant options", async () => {
    dbMock.variantOptions = []

    await expect(
      saveSpecial(
        buildFormData({
          specialType: "orderable_deal",
          discountType: "fixed_price",
          discountValue: "20",
          componentCount: "1",
          "componentLabel-0": "Choose a pizza",
          "componentSortOrder-0": "1",
          "componentRequiredQuantity-0": "1",
          "componentMinQuantity-0": "1",
          "componentMaxQuantity-0": "1",
          "componentProductIds-0": ["product-a"],
          "componentProductVariantOptionIds-0-product-a": ["variant-other"],
        })
      )
    ).rejects.toThrow("selected variant options are invalid")
  })

  it("rejects invalid orderable deal component quantity rules", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          specialType: "orderable_deal",
          discountType: "fixed_price",
          discountValue: "20",
          componentCount: "1",
          "componentLabel-0": "Choose a pizza",
          "componentSortOrder-0": "1",
          "componentRequiredQuantity-0": "2",
          "componentMinQuantity-0": "1",
          "componentMaxQuantity-0": "1",
          "componentProductIds-0": ["product-a"],
        })
      )
    ).rejects.toThrow("min <= required <= max")
  })

  it("refuses product eligibility from another business", async () => {
    dbMock.products = []

    await expect(
      saveSpecial(buildFormData({ productIds: ["product-b"] }))
    ).rejects.toThrow("selected products are invalid")
  })

  it("refuses menu group eligibility from another business", async () => {
    dbMock.menuGroups = []

    await expect(
      saveSpecial(buildFormData({ menuGroupIds: ["menu-group-b"] }))
    ).rejects.toThrow("selected categories are invalid")
  })

  it("rejects invalid overnight availability windows", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          availabilityMode: "specific",
          "availabilityDay-1": "true",
          "availabilityStart-1": "22:00",
          "availabilityEnd-1": "02:00",
        })
      )
    ).rejects.toThrow("Availability windows")
  })

  it("saves availability windows", async () => {
    await expect(
      saveSpecial(
        buildFormData({
          availabilityMode: "specific",
          "availabilityDay-1": "true",
          "availabilityStart-1": "11:00",
          "availabilityEnd-1": "14:00",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "special_availability_windows" &&
          operation.operation === "insert"
      )
    ).toMatchObject({
      payload: [
        expect.objectContaining({
          business_id: "business-a",
          special_id: "special-new",
          day_of_week: 1,
          start_time: "11:00",
          end_time: "14:00",
          is_all_day: false,
        }),
      ],
    })
  })

  it("rejects edits for a special from another business", async () => {
    dbMock.specialExists = false

    await expect(
      saveSpecial(buildFormData({ specialId: "other-special" }))
    ).rejects.toThrow("could not be found")
  })

  it("enable and disable only updates the special status", async () => {
    const formData = buildFormData({
      specialId: "special-a",
      isEnabled: "true",
    })

    await setSpecialEnabled(formData)

    expect(
      dbMock.operations.find(
        (operation) =>
          operation.table === "specials" && operation.operation === "update"
      )
    ).toMatchObject({
      payload: { is_enabled: true },
    })
    expect(
      dbMock.operations.some((operation) => operation.operation === "delete")
    ).toBe(false)
  })
})
