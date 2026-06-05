"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  resolveProductAdminActionContext,
  type ProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"
import {
  getProductModifierAvailabilityHref,
  getVariantGroupDetailHref,
} from "@/features/admin-products/utils/product-admin-routes"
import {
  buildVariantModifierAvailabilityRulePayload,
  buildVariantModifierPriceOverridePayload,
} from "@/features/admin-products/utils/variant-modifier-availability"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseBoolean(value: FormDataEntryValue | null) {
  if (value === "true") return true
  if (value === "false") return false

  throw new Error("Availability value is invalid.")
}

function parseOptionalPrice(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error("Price override must be zero or greater.")
  }

  return parsedValue
}

async function assertProductVariantModifierContext({
  businessId,
  productId,
  variantGroupId,
  variantGroupOptionId,
  modifierGroupId,
  modifierOptionId,
}: {
  businessId: string
  productId: string
  variantGroupId: string
  variantGroupOptionId: string
  modifierGroupId: string
  modifierOptionId: string
}) {
  const [
    { data: product },
    { data: variantOption },
    { data: variantAssignment },
    { data: modifierAssignment },
    { data: modifierOption },
  ] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("id")
      .eq("business_id", businessId)
      .eq("id", productId)
      .single(),
    supabaseAdmin
      .from("variant_group_options")
      .select("id")
      .eq("business_id", businessId)
      .eq("id", variantGroupOptionId)
      .eq("variant_group_id", variantGroupId)
      .single(),
    supabaseAdmin
      .from("product_variant_groups")
      .select("id")
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .eq("variant_group_id", variantGroupId)
      .eq("is_enabled", true)
      .single(),
    supabaseAdmin
      .from("product_modifier_groups")
      .select("id")
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .eq("modifier_group_id", modifierGroupId)
      .eq("is_enabled", true)
      .single(),
    supabaseAdmin
      .from("modifier_options")
      .select("id")
      .eq("business_id", businessId)
      .eq("modifier_group_id", modifierGroupId)
      .eq("id", modifierOptionId)
      .single(),
  ])

  if (
    !product ||
    !variantOption ||
    !variantAssignment ||
    !modifierAssignment ||
    !modifierOption
  ) {
    throw new Error("Selected modifier availability context is invalid.")
  }
}

function getActionBusinessSlug(context: ProductAdminActionContext) {
  return context.isScoped ? context.businessSlug : undefined
}

function revalidateVariantModifierPaths({
  context,
  productId,
  variantGroupId,
  modifierGroupId,
}: {
  context: ProductAdminActionContext
  productId: string
  variantGroupId: string
  modifierGroupId: string
}) {
  const businessSlug = getActionBusinessSlug(context)

  revalidatePath(
    getVariantGroupDetailHref({
      groupId: variantGroupId,
      businessSlug,
    })
  )
  revalidatePath(
    getVariantGroupDetailHref({
      groupId: variantGroupId,
      productId,
      businessSlug,
    })
  )
  revalidatePath(
    getProductModifierAvailabilityHref({
      modifierGroupId,
      productId,
      businessSlug,
    })
  )
  revalidatePath("/menu")
}

export async function setProductVariantModifierOptionAvailability(
  formData: FormData
) {
  const context = await resolveProductAdminActionContext(formData)
  const productId = parseString(formData.get("productId"), "Product")
  const variantGroupId = parseString(
    formData.get("variantGroupId"),
    "Variant group"
  )
  const variantGroupOptionId = parseString(
    formData.get("variantGroupOptionId"),
    "Variant option"
  )
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const modifierOptionId = parseString(
    formData.get("modifierOptionId"),
    "Modifier option"
  )
  const isAvailable = parseBoolean(formData.get("isAvailable"))

  await assertProductVariantModifierContext({
    businessId: context.businessId,
    productId,
    variantGroupId,
    variantGroupOptionId,
    modifierGroupId,
    modifierOptionId,
  })

  if (isAvailable) {
    const { error } = await supabaseAdmin
      .from("product_variant_modifier_option_availability_rules")
      .delete()
      .eq("business_id", context.businessId)
      .eq("product_id", productId)
      .eq("variant_group_option_id", variantGroupOptionId)
      .eq("modifier_group_id", modifierGroupId)
      .eq("modifier_option_id", modifierOptionId)

    if (error) {
      throw new Error(`Could not remove availability rule: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin
      .from("product_variant_modifier_option_availability_rules")
      .upsert(
        buildVariantModifierAvailabilityRulePayload({
          businessId: context.businessId,
          productId,
          variantGroupOptionId,
          modifierGroupId,
          modifierOptionId,
        }),
        {
          onConflict:
            "product_id,variant_group_option_id,modifier_option_id",
        }
      )

    if (error) {
      throw new Error(`Could not save availability rule: ${error.message}`)
    }
  }

  revalidateVariantModifierPaths({
    context,
    productId,
    variantGroupId,
    modifierGroupId,
  })
}

export async function setProductVariantModifierOptionPriceOverride(
  formData: FormData
) {
  const context = await resolveProductAdminActionContext(formData)
  const productId = parseString(formData.get("productId"), "Product")
  const variantGroupId = parseString(
    formData.get("variantGroupId"),
    "Variant group"
  )
  const variantGroupOptionId = parseString(
    formData.get("variantGroupOptionId"),
    "Variant option"
  )
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const modifierOptionId = parseString(
    formData.get("modifierOptionId"),
    "Modifier option"
  )
  const priceDelta = parseOptionalPrice(formData.get("priceDelta"))

  await assertProductVariantModifierContext({
    businessId: context.businessId,
    productId,
    variantGroupId,
    variantGroupOptionId,
    modifierGroupId,
    modifierOptionId,
  })

  if (priceDelta === null) {
    const { error } = await supabaseAdmin
      .from("product_variant_modifier_option_price_overrides")
      .delete()
      .eq("business_id", context.businessId)
      .eq("product_id", productId)
      .eq("variant_group_option_id", variantGroupOptionId)
      .eq("modifier_group_id", modifierGroupId)
      .eq("modifier_option_id", modifierOptionId)

    if (error) {
      throw new Error(`Could not clear price override: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin
      .from("product_variant_modifier_option_price_overrides")
      .upsert(
        buildVariantModifierPriceOverridePayload({
          businessId: context.businessId,
          productId,
          variantGroupOptionId,
          modifierGroupId,
          modifierOptionId,
          priceDelta,
        }),
        {
          onConflict:
            "product_id,variant_group_option_id,modifier_group_id,modifier_option_id",
        }
      )

    if (error) {
      throw new Error(`Could not save price override: ${error.message}`)
    }
  }

  revalidateVariantModifierPaths({
    context,
    productId,
    variantGroupId,
    modifierGroupId,
  })
}
