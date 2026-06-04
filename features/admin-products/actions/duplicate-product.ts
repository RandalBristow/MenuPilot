"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  duplicateProductSetup,
  type DuplicateProductInput,
  type DuplicateProductRecord,
  type DuplicateProductResult,
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
} from "@/features/admin-products/utils/duplicate-product"

const BUSINESS_SLUG = "pronto-demo"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true"
}

async function getBusinessId() {
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (error || !business) {
    throw new Error("Could not load product business.")
  }

  return business.id as string
}

async function findProduct(
  businessId: string,
  productId: string
): Promise<DuplicateProductRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      `
      id,
      business_id,
      name,
      description,
      base_price,
      sku,
      image_media_id,
      builder_template,
      has_variants,
      prep_time_minutes,
      prep_time_type,
      is_taxable,
      is_featured
    `
    )
    .eq("business_id", businessId)
    .eq("id", productId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load source product: ${error.message}`)
  }

  if (!data) return null

  return {
    id: data.id as string,
    business_id: data.business_id as string,
    name: data.name as string,
    description: (data.description as string | null) ?? null,
    base_price:
      data.base_price === null || data.base_price === undefined
        ? null
        : Number(data.base_price),
    sku: (data.sku as string | null) ?? null,
    image_media_id: (data.image_media_id as string | null) ?? null,
    builder_template: data.builder_template as string,
    has_variants: Boolean(data.has_variants),
    prep_time_minutes: Number(data.prep_time_minutes),
    prep_time_type: data.prep_time_type as string,
    is_taxable: Boolean(data.is_taxable),
    is_featured: Boolean(data.is_featured),
  }
}

async function createProduct(product: NewProductRecord) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .insert(product)
    .select("id")
    .single()

  if (error || !data) {
    throw new Error(`Could not create duplicate product: ${error?.message}`)
  }

  return { id: data.id as string }
}

async function deleteProduct(productId: string) {
  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", productId)

  if (error) {
    throw new Error(`Could not clean up duplicate product: ${error.message}`)
  }
}

async function getNextProductGroupSortOrder({
  businessId,
  menuGroupId,
}: {
  businessId: string
  menuGroupId: string
}) {
  const { data, error } = await supabaseAdmin
    .from("product_groups")
    .select("sort_order")
    .eq("business_id", businessId)
    .eq("menu_group_id", menuGroupId)
    .order("sort_order", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Could not load product sort order: ${error.message}`)
  }

  return Number(data?.[0]?.sort_order ?? 0) + 1
}

async function listProductGroups(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_groups")
    .select("business_id, product_id, menu_group_id, is_primary, sort_order")
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not load product categories: ${error.message}`)
  }

  return (data ?? []) as ProductGroupCopyRecord[]
}

async function insertProductGroups(records: ProductGroupCopyRecord[]) {
  if (records.length === 0) return

  const { error } = await supabaseAdmin.from("product_groups").insert(records)

  if (error) {
    throw new Error(`Could not copy product categories: ${error.message}`)
  }
}

async function listProductVariantGroups(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_variant_groups")
    .select("business_id, product_id, variant_group_id, is_enabled, sort_order")
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not load variant group assignments: ${error.message}`)
  }

  return (data ?? []) as ProductVariantGroupCopyRecord[]
}

async function insertProductVariantGroups(
  records: ProductVariantGroupCopyRecord[]
) {
  if (records.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_variant_groups")
    .insert(records)

  if (error) {
    throw new Error(`Could not copy variant group assignments: ${error.message}`)
  }
}

async function listProductVariantOptionOverrides(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_variant_option_overrides")
    .select(
      `
      business_id,
      product_id,
      variant_group_option_id,
      price_override,
      prep_time_minutes_override,
      is_enabled,
      is_default,
      sort_order
    `
    )
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not load variant option overrides: ${error.message}`)
  }

  return (data ?? []).map((record) => ({
    ...record,
    price_override:
      record.price_override === null || record.price_override === undefined
        ? null
        : Number(record.price_override),
  })) as ProductVariantOptionOverrideCopyRecord[]
}

async function insertProductVariantOptionOverrides(
  records: ProductVariantOptionOverrideCopyRecord[]
) {
  if (records.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_variant_option_overrides")
    .insert(records)

  if (error) {
    throw new Error(`Could not copy variant option overrides: ${error.message}`)
  }
}

async function listProductModifierGroups(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("business_id, product_id, modifier_group_id, is_enabled, sort_order")
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not load modifier group assignments: ${error.message}`)
  }

  return (data ?? []) as ProductModifierGroupCopyRecord[]
}

async function insertProductModifierGroups(
  records: ProductModifierGroupCopyRecord[]
) {
  if (records.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_modifier_groups")
    .insert(records)

  if (error) {
    throw new Error(`Could not copy modifier group assignments: ${error.message}`)
  }
}

async function listProductModifierOptionOverrides(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_modifier_option_overrides")
    .select(
      `
      business_id,
      product_id,
      modifier_option_id,
      price_delta_override,
      prep_time_delta_minutes_override,
      is_enabled,
      sort_order
    `
    )
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not load modifier option overrides: ${error.message}`)
  }

  return (data ?? []).map((record) => ({
    ...record,
    price_delta_override:
      record.price_delta_override === null ||
      record.price_delta_override === undefined
        ? null
        : Number(record.price_delta_override),
  })) as ProductModifierOptionOverrideCopyRecord[]
}

async function insertProductModifierOptionOverrides(
  records: ProductModifierOptionOverrideCopyRecord[]
) {
  if (records.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_modifier_option_overrides")
    .insert(records)

  if (error) {
    throw new Error(`Could not copy modifier option overrides: ${error.message}`)
  }
}

async function listProductDefaultModifierOptions(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_default_modifier_options")
    .select(
      `
      business_id,
      product_id,
      modifier_group_id,
      modifier_option_id,
      quantity,
      is_removable,
      placement,
      multiplier,
      is_enabled,
      sort_order
    `
    )
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not load default modifiers: ${error.message}`)
  }

  return (data ?? []).map((record) => ({
    ...record,
    quantity: Number(record.quantity),
    multiplier: Number(record.multiplier),
  })) as ProductDefaultModifierOptionCopyRecord[]
}

async function insertProductDefaultModifierOptions(
  records: ProductDefaultModifierOptionCopyRecord[]
) {
  if (records.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_default_modifier_options")
    .insert(records)

  if (error) {
    throw new Error(`Could not copy default modifiers: ${error.message}`)
  }
}

async function listProductIncludedModifierGroups(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_included_modifier_groups")
    .select(
      `
      business_id,
      product_id,
      modifier_group_id,
      included_quantity,
      is_swappable,
      charge_for_extra
    `
    )
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not load included modifier rules: ${error.message}`)
  }

  return (data ?? []).map((record) => ({
    ...record,
    included_quantity: Number(record.included_quantity),
  })) as ProductIncludedModifierGroupCopyRecord[]
}

async function insertProductIncludedModifierGroups(
  records: ProductIncludedModifierGroupCopyRecord[]
) {
  if (records.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_included_modifier_groups")
    .insert(records)

  if (error) {
    throw new Error(`Could not copy included modifier rules: ${error.message}`)
  }
}

async function listProductVariantModifierOptionAvailabilityRules(
  productId: string
) {
  const { data, error } = await supabaseAdmin
    .from("product_variant_modifier_option_availability_rules")
    .select(
      `
      business_id,
      product_id,
      variant_group_option_id,
      modifier_group_id,
      modifier_option_id,
      is_available,
      is_enabled
    `
    )
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not load variant availability rules: ${error.message}`)
  }

  return (data ??
    []) as ProductVariantModifierOptionAvailabilityRuleCopyRecord[]
}

async function insertProductVariantModifierOptionAvailabilityRules(
  records: ProductVariantModifierOptionAvailabilityRuleCopyRecord[]
) {
  if (records.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_variant_modifier_option_availability_rules")
    .insert(records)

  if (error) {
    throw new Error(`Could not copy variant availability rules: ${error.message}`)
  }
}

async function listProductVariantModifierOptionPriceOverrides(
  productId: string
) {
  const { data, error } = await supabaseAdmin
    .from("product_variant_modifier_option_price_overrides")
    .select(
      `
      business_id,
      product_id,
      variant_group_option_id,
      modifier_group_id,
      modifier_option_id,
      price_delta,
      is_enabled
    `
    )
    .eq("product_id", productId)

  if (error) {
    throw new Error(
      `Could not load variant-specific modifier price overrides: ${error.message}`
    )
  }

  return (data ?? []).map((record) => ({
    ...record,
    price_delta: Number(record.price_delta),
  })) as ProductVariantModifierOptionPriceOverrideCopyRecord[]
}

async function insertProductVariantModifierOptionPriceOverrides(
  records: ProductVariantModifierOptionPriceOverrideCopyRecord[]
) {
  if (records.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_variant_modifier_option_price_overrides")
    .insert(records)

  if (error) {
    throw new Error(
      `Could not copy variant-specific modifier price overrides: ${error.message}`
    )
  }
}

function createStore(businessId: string): ProductDuplicateStore {
  return {
    findProduct: (productId) => findProduct(businessId, productId),
    createProduct,
    deleteProduct,
    getNextProductGroupSortOrder,
    listProductGroups,
    insertProductGroups,
    listProductVariantGroups,
    insertProductVariantGroups,
    listProductVariantOptionOverrides,
    insertProductVariantOptionOverrides,
    listProductModifierGroups,
    insertProductModifierGroups,
    listProductModifierOptionOverrides,
    insertProductModifierOptionOverrides,
    listProductDefaultModifierOptions,
    insertProductDefaultModifierOptions,
    listProductIncludedModifierGroups,
    insertProductIncludedModifierGroups,
    listProductVariantModifierOptionAvailabilityRules,
    insertProductVariantModifierOptionAvailabilityRules,
    listProductVariantModifierOptionPriceOverrides,
    insertProductVariantModifierOptionPriceOverrides,
  }
}

function parseDuplicateProductInput(formData: FormData): DuplicateProductInput {
  return {
    productId: parseString(formData.get("productId"), "Product"),
    newName: parseString(formData.get("newName"), "New product name"),
    copyImage: parseBoolean(formData.get("copyImage")),
    isEnabled: parseBoolean(formData.get("isEnabled")),
  }
}

export async function duplicateProduct(
  formData: FormData
): Promise<DuplicateProductResult> {
  try {
    const businessId = await getBusinessId()
    const result = await duplicateProductSetup({
      input: parseDuplicateProductInput(formData),
      store: createStore(businessId),
    })

    if (result.status === "duplicated") {
      revalidatePath("/admin/products")
      revalidatePath("/admin/products/list")
      revalidatePath(`/admin/products/${result.productId}`)
    }

    return result
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
