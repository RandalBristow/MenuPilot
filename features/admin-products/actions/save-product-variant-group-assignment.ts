"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getProductAdminActionHref,
  resolveProductAdminActionContext,
  type ProductAdminActionContext,
} from "@/features/admin-products/utils/product-admin-action-context"
import {
  getProductDetailHref,
  getProductVariantAssignmentsHref,
} from "@/features/admin-products/utils/product-admin-routes"
import { getVariantGroupAssignmentEnableError } from "@/features/admin-products/utils/variant-group-assignment-rules"

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseNullableString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function parseSortOrder(value: FormDataEntryValue | null) {
  const sortOrder = Number(value)

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be zero or greater.")
  }

  return sortOrder
}

function parseNullableNumber(
  value: FormDataEntryValue | null,
  fieldName: string
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} must be zero or greater.`)
  }

  return number
}

function parseNullableInteger(
  value: FormDataEntryValue | null,
  fieldName: string
) {
  const number = parseNullableNumber(value, fieldName)

  if (number === null) return null

  if (!Number.isInteger(number)) {
    throw new Error(`${fieldName} must be a whole number.`)
  }

  return number
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true"
}

function parseNullableBoolean(value: FormDataEntryValue | null) {
  if (value === "true") return true
  if (value === "false") return false

  return null
}

async function assertProduct(businessId: string, productId: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected product is invalid.")
  }
}

async function assertVariantGroup(businessId: string, variantGroupId: string) {
  const { data, error } = await supabaseAdmin
    .from("variant_groups")
    .select("id")
    .eq("id", variantGroupId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected variant group is invalid.")
  }
}

async function getExistingAssignment(
  businessId: string,
  assignmentId: string | null
) {
  if (!assignmentId) return null

  const { data, error } = await supabaseAdmin
    .from("product_variant_groups")
    .select("id, product_id, variant_group_id")
    .eq("id", assignmentId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected variant group assignment is invalid.")
  }

  return data as {
    id: string
    product_id: string
    variant_group_id: string
  }
}

async function getProductVariantGroupAssignmentStates(
  businessId: string,
  productId: string
) {
  const { data, error } = await supabaseAdmin
    .from("product_variant_groups")
    .select("id, is_enabled")
    .eq("business_id", businessId)
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not validate variant assignments: ${error.message}`)
  }

  return (data ?? []) as Array<{
    id: string
    is_enabled: boolean
  }>
}

async function getActiveVariantGroupId(businessId: string, productId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_variant_groups")
    .select("variant_group_id")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("is_enabled", true)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load active variant group: ${error.message}`)
  }

  if (!data) {
    throw new Error("Select a variant group before editing product overrides.")
  }

  return data.variant_group_id as string
}

async function assertVariantGroupOption(
  businessId: string,
  variantGroupId: string,
  optionId: string
) {
  const { data, error } = await supabaseAdmin
    .from("variant_group_options")
    .select("id")
    .eq("id", optionId)
    .eq("business_id", businessId)
    .eq("variant_group_id", variantGroupId)
    .single()

  if (error || !data) {
    throw new Error("Selected variant option is invalid.")
  }
}

async function clearProductDefaultOverrides({
  businessId,
  productId,
  optionIds,
  selectedOptionId,
}: {
  businessId: string
  productId: string
  optionIds: string[]
  selectedOptionId: string
}) {
  const rows = optionIds
    .filter((optionId) => optionId !== selectedOptionId)
    .map((optionId) => ({
      business_id: businessId,
      product_id: productId,
      variant_group_option_id: optionId,
      is_default: false,
    }))

  if (rows.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_variant_option_overrides")
    .upsert(rows, {
      onConflict: "product_id,variant_group_option_id",
    })

  if (error) {
    throw new Error(`Could not update default overrides: ${error.message}`)
  }
}

async function getVariantGroupOptionIds(
  businessId: string,
  variantGroupId: string
) {
  const { data, error } = await supabaseAdmin
    .from("variant_group_options")
    .select("id")
    .eq("business_id", businessId)
    .eq("variant_group_id", variantGroupId)

  if (error) {
    throw new Error(`Could not load variant options: ${error.message}`)
  }

  return (data ?? []).map((option) => option.id as string)
}

function getActionBusinessSlug(context: ProductAdminActionContext) {
  return context.isScoped ? context.businessSlug : undefined
}

function revalidateVariantAssignmentPaths({
  context,
  productId,
}: {
  context: ProductAdminActionContext
  productId: string
}) {
  const businessSlug = getActionBusinessSlug(context)

  revalidatePath(getProductAdminActionHref(context))
  revalidatePath(getProductVariantAssignmentsHref(undefined, businessSlug))
  revalidatePath(getProductVariantAssignmentsHref(productId, businessSlug))
  revalidatePath(getProductDetailHref(productId, businessSlug))
  revalidatePath("/menu")
}

async function deleteProductVariantOptionOverrides({
  businessId,
  productId,
  variantGroupId,
}: {
  businessId: string
  productId: string
  variantGroupId: string
}) {
  const optionIds = await getVariantGroupOptionIds(businessId, variantGroupId)

  if (optionIds.length === 0) return

  const { error } = await supabaseAdmin
    .from("product_variant_option_overrides")
    .delete()
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .in("variant_group_option_id", optionIds)

  if (error) {
    throw new Error(`Could not remove product overrides: ${error.message}`)
  }
}

export async function saveProductVariantGroupAssignment(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const assignmentId = parseNullableString(formData.get("assignmentId"))
  const productId = parseString(formData.get("productId"), "Product")
  const variantGroupId = parseString(
    formData.get("variantGroupId"),
    "Variant group"
  )
  const isEnabled = parseBoolean(formData.get("isEnabled"))
  const sortOrder = parseSortOrder(formData.get("sortOrder"))

  await Promise.all([
    assertProduct(context.businessId, productId),
    assertVariantGroup(context.businessId, variantGroupId),
  ])

  const existingAssignment = await getExistingAssignment(
    context.businessId,
    assignmentId
  )

  if (
    existingAssignment &&
    (existingAssignment.product_id !== productId ||
      existingAssignment.variant_group_id !== variantGroupId)
  ) {
    throw new Error("Variant group assignments cannot be moved yet.")
  }

  const enableError = getVariantGroupAssignmentEnableError({
    assignments: await getProductVariantGroupAssignmentStates(
      context.businessId,
      productId
    ),
    assignmentId,
    isEnabled,
  })

  if (enableError) {
    throw new Error(enableError)
  }

  if (assignmentId) {
    const { error } = await supabaseAdmin
      .from("product_variant_groups")
      .update({
        is_enabled: isEnabled,
        sort_order: sortOrder,
      })
      .eq("id", assignmentId)
      .eq("business_id", context.businessId)

    if (error) {
      throw new Error(`Could not update variant assignment: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin.from("product_variant_groups").insert({
      business_id: context.businessId,
      product_id: productId,
      variant_group_id: variantGroupId,
      is_enabled: isEnabled,
      sort_order: sortOrder,
    })

    if (error) {
      throw new Error(`Could not attach variant group: ${error.message}`)
    }
  }

  revalidateVariantAssignmentPaths({ context, productId })
}

export async function detachProductVariantGroupAssignment(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const assignmentId = parseString(formData.get("assignmentId"), "Assignment")
  const productId = parseString(formData.get("productId"), "Product")
  await assertProduct(context.businessId, productId)
  const existingAssignment = await getExistingAssignment(
    context.businessId,
    assignmentId
  )

  if (!existingAssignment || existingAssignment.product_id !== productId) {
    throw new Error("Selected variant group assignment is invalid.")
  }

  await deleteProductVariantOptionOverrides({
    businessId: context.businessId,
    productId,
    variantGroupId: existingAssignment.variant_group_id,
  })

  const { error } = await supabaseAdmin
    .from("product_variant_groups")
    .delete()
    .eq("id", assignmentId)
    .eq("business_id", context.businessId)
    .eq("product_id", productId)

  if (error) {
    throw new Error(`Could not detach variant group: ${error.message}`)
  }

  revalidateVariantAssignmentPaths({ context, productId })
}

export async function selectProductVariantGroupAssignment(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const productId = parseString(formData.get("productId"), "Product")
  const variantGroupId = parseString(
    formData.get("variantGroupId"),
    "Variant group"
  )

  await Promise.all([
    assertProduct(context.businessId, productId),
    assertVariantGroup(context.businessId, variantGroupId),
  ])

  const { error: disableError } = await supabaseAdmin
    .from("product_variant_groups")
    .update({ is_enabled: false })
    .eq("business_id", context.businessId)
    .eq("product_id", productId)

  if (disableError) {
    throw new Error(
      `Could not update variant assignments: ${disableError.message}`
    )
  }

  const { error } = await supabaseAdmin.from("product_variant_groups").upsert(
    {
      business_id: context.businessId,
      product_id: productId,
      variant_group_id: variantGroupId,
      is_enabled: true,
      sort_order: 0,
    },
    {
      onConflict: "product_id,variant_group_id",
    }
  )

  if (error) {
    throw new Error(`Could not select variant group: ${error.message}`)
  }

  revalidateVariantAssignmentPaths({ context, productId })
}

export async function saveProductVariantOptionOverride(formData: FormData) {
  const context = await resolveProductAdminActionContext(formData)
  const productId = parseString(formData.get("productId"), "Product")
  const optionId = parseString(formData.get("variantGroupOptionId"), "Option")
  const priceOverride = parseNullableNumber(
    formData.get("priceOverride"),
    "Price override"
  )
  const prepTimeMinutesOverride = parseNullableInteger(
    formData.get("prepTimeMinutesOverride"),
    "Prep time override"
  )
  const isEnabled = parseNullableBoolean(formData.get("isEnabled"))
  const isDefault = parseNullableBoolean(formData.get("isDefault"))
  const sortOrder = parseNullableInteger(
    formData.get("sortOrder"),
    "Sort order override"
  )

  await assertProduct(context.businessId, productId)
  const activeVariantGroupId = await getActiveVariantGroupId(
    context.businessId,
    productId
  )
  await assertVariantGroupOption(context.businessId, activeVariantGroupId, optionId)

  if (isDefault) {
    const optionIds = await getVariantGroupOptionIds(
      context.businessId,
      activeVariantGroupId
    )

    await clearProductDefaultOverrides({
      businessId: context.businessId,
      productId,
      optionIds,
      selectedOptionId: optionId,
    })
  }

  const { error } = await supabaseAdmin
    .from("product_variant_option_overrides")
    .upsert(
      {
        business_id: context.businessId,
        product_id: productId,
        variant_group_option_id: optionId,
        price_override: priceOverride,
        prep_time_minutes_override: prepTimeMinutesOverride,
        is_enabled: isEnabled,
        is_default: isDefault,
        sort_order: sortOrder,
      },
      {
        onConflict: "product_id,variant_group_option_id",
      }
    )

  if (error) {
    throw new Error(`Could not save variant option override: ${error.message}`)
  }

  revalidateVariantAssignmentPaths({ context, productId })
}
