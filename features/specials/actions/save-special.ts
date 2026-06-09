"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  SPECIAL_DISCOUNT_TYPES,
  SPECIAL_TYPES,
  type SpecialAvailabilityWindow,
  type SpecialDiscountType,
  type SpecialType,
} from "@/features/specials/types/special"
import type { OrderableDealComponentPricingMode } from "@/features/specials/types/orderable-deal"
import { getSpecialAdminBaseHref } from "@/features/specials/utils/special-admin-routes"
import { resolveSpecialAdminActionContext } from "@/features/specials/utils/special-admin-action-context"
import { isAvailabilityWindowValid } from "@/features/specials/utils/special-schedule"

type SpecialPayload = {
  name: string
  description: string | null
  customer_description: string | null
  special_type: SpecialType
  discount_type: SpecialDiscountType
  discount_value: number
  min_order_amount: number | null
  starts_at: string | null
  ends_at: string | null
  is_enabled: boolean
}

type DealComponentInput = {
  label: string
  description: string | null
  sortOrder: number
  requiredQuantity: number
  minQuantity: number
  maxQuantity: number
  pricingMode: Exclude<OrderableDealComponentPricingMode, "normal_price">
  fixedPrice: number | null
  productIds: string[]
  productVariantRestrictions: Array<{
    productId: string
    allowedVariantOptionIds: string[]
  }>
  modifierGroupOverrides: Array<{
    productId: string
    modifierGroupId: string
    includedSelectionCount: number
  }>
}

type MixMatchInput = {
  minQuantity: number
  maxQuantity: number | null
  unitPrice: number
  allowExtraItems: boolean
  productIds: string[]
  productVariantRestrictions: Array<{
    productId: string
    allowedVariantOptionIds: string[]
  }>
  modifierGroupOverrides: Array<{
    productId: string
    modifierGroupId: string
    includedSelectionCount: number
  }>
}

function parseRequiredString(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`)
  }

  return value.trim()
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) return null

  return value.trim()
}

function parseNumber(value: FormDataEntryValue | null, field: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a number.`)
  }

  return parsed
}

function parseInteger(value: FormDataEntryValue | null, field: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    throw new Error(`${field} must be a whole number.`)
  }

  return parsed
}

function parseOptionalMoney(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Minimum order amount must be zero or greater.")
  }

  return parsed
}

function parseOptionalNonnegativeNumber(
  value: FormDataEntryValue | null,
  field: string
) {
  if (typeof value !== "string" || value.trim().length === 0) return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} must be zero or greater.`)
  }

  return parsed
}

function parseDateTime(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Schedule date/time is invalid.")
  }

  return date.toISOString()
}

function parseSpecialType(value: FormDataEntryValue | null): SpecialType {
  const specialType = parseRequiredString(value, "Special type")

  if (!SPECIAL_TYPES.includes(specialType as SpecialType)) {
    throw new Error("Selected special type is invalid.")
  }

  return specialType as SpecialType
}

function parseDiscountType(
  value: FormDataEntryValue | null
): SpecialDiscountType {
  const discountType = parseRequiredString(value, "Discount type")

  if (!SPECIAL_DISCOUNT_TYPES.includes(discountType as SpecialDiscountType)) {
    throw new Error("Selected discount type is invalid.")
  }

  return discountType as SpecialDiscountType
}

function parseComponentPricingMode(
  value: FormDataEntryValue | null
): Exclude<OrderableDealComponentPricingMode, "normal_price"> {
  const pricingMode = parseRequiredString(value, "Component pricing mode")

  if (pricingMode === "included" || pricingMode === "fixed_price") {
    return pricingMode
  }

  if (pricingMode === "normal_price") {
    throw new Error("Normal product price component pricing is not available yet.")
  }

  throw new Error("Selected component pricing mode is invalid.")
}

function parseIdList(formData: FormData, field: string) {
  return formData
    .getAll(field)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
}

function assertDiscountCombination({
  specialType,
  discountType,
}: {
  specialType: SpecialType
  discountType: SpecialDiscountType
}) {
  if (
    specialType === "line_discount" &&
    (discountType === "percentage" || discountType === "fixed_amount")
  ) {
    return
  }

  if (specialType === "fixed_price_line" && discountType === "fixed_price") {
    return
  }

  if (
    specialType === "cart_discount" &&
    (discountType === "percentage" || discountType === "fixed_amount")
  ) {
    return
  }

  if (specialType === "orderable_deal" && discountType === "fixed_price") {
    return
  }

  if (
    specialType === "mix_and_match_fixed_unit_price" &&
    discountType === "fixed_price"
  ) {
    return
  }

  throw new Error("Selected special type and discount type do not match.")
}

function parseSpecialPayload(formData: FormData): SpecialPayload {
  const specialType = parseSpecialType(formData.get("specialType"))
  const discountType = parseDiscountType(formData.get("discountType"))
  const discountValue = parseNumber(
    specialType === "mix_and_match_fixed_unit_price"
      ? formData.get("mixUnitPrice")
      : formData.get("discountValue"),
    specialType === "orderable_deal"
      ? "Deal base price"
      : specialType === "mix_and_match_fixed_unit_price"
        ? "Mix unit price"
        : "Discount value"
  )
  const startsAt = parseDateTime(formData.get("startsAt"))
  const endsAt = parseDateTime(formData.get("endsAt"))

  assertDiscountCombination({ specialType, discountType })

  if (discountValue <= 0) {
    throw new Error(
      specialType === "orderable_deal"
        ? "Deal base price must be greater than zero."
        : specialType === "mix_and_match_fixed_unit_price"
          ? "Mix unit price must be greater than zero."
        : "Discount value must be greater than zero."
    )
  }

  if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
    throw new Error("Start date/time must be before end date/time.")
  }

  return {
    name: parseRequiredString(formData.get("name"), "Name"),
    description: parseOptionalString(formData.get("description")),
    customer_description: parseOptionalString(
      formData.get("customerDescription")
    ),
    special_type: specialType,
    discount_type: discountType,
    discount_value: discountValue,
    min_order_amount:
      specialType === "cart_discount"
        ? parseOptionalMoney(formData.get("minOrderAmount"))
        : null,
    starts_at: startsAt,
    ends_at: endsAt,
    is_enabled: formData.get("isEnabled") === "true",
  }
}

function parseOptionalPositiveInteger(
  value: FormDataEntryValue | null,
  field: string
) {
  if (typeof value !== "string" || value.trim().length === 0) return null

  const parsed = parseInteger(value, field)

  if (parsed <= 0) {
    throw new Error(`${field} must be greater than zero.`)
  }

  return parsed
}

function parseProductVariantRestrictions({
  formData,
  productIds,
  inputNamePrefix,
}: {
  formData: FormData
  productIds: string[]
  inputNamePrefix: string
}) {
  return productIds
    .map((productId) => ({
      productId,
      allowedVariantOptionIds: [
        ...new Set(parseIdList(formData, `${inputNamePrefix}-${productId}`)),
      ],
    }))
    .filter((restriction) => restriction.allowedVariantOptionIds.length > 0)
}

function parseProductModifierGroupOverrides({
  formData,
  productIds,
  inputNamePrefix,
  fieldLabel,
}: {
  formData: FormData
  productIds: string[]
  inputNamePrefix: string
  fieldLabel: string
}) {
  const prefix = `${inputNamePrefix}::`
  const selectedProductIds = new Set(productIds)
  const overrides: MixMatchInput["modifierGroupOverrides"] = []

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(prefix)) continue

    const [productId, modifierGroupId] = key.slice(prefix.length).split("::")
    if (!productId || !modifierGroupId || !selectedProductIds.has(productId)) {
      continue
    }

    const includedSelectionCount = parseOptionalNonnegativeNumber(
      value,
      fieldLabel
    )

    if (includedSelectionCount === null) continue

    overrides.push({
      productId,
      modifierGroupId,
      includedSelectionCount,
    })
  }

  return overrides
}

function parseMixMatchInput(formData: FormData): MixMatchInput {
  const minQuantity = parseInteger(
    formData.get("mixMinQuantity"),
    "Mix minimum quantity"
  )
  const maxQuantity = parseOptionalPositiveInteger(
    formData.get("mixMaxQuantity"),
    "Mix maximum quantity"
  )
  const unitPrice = parseNumber(formData.get("mixUnitPrice"), "Mix unit price")
  const productIds = [...new Set(parseIdList(formData, "mixProductIds"))]

  if (minQuantity <= 0) {
    throw new Error("Mix minimum quantity must be greater than zero.")
  }

  if (maxQuantity !== null && maxQuantity < minQuantity) {
    throw new Error("Mix maximum quantity must be greater than or equal to minimum quantity.")
  }

  if (unitPrice <= 0) {
    throw new Error("Mix unit price must be greater than zero.")
  }

  if (productIds.length === 0) {
    throw new Error("Mix and match needs at least one pool product.")
  }

  return {
    minQuantity,
    maxQuantity,
    unitPrice,
    allowExtraItems: formData.get("mixAllowExtraItems") === "true",
    productIds,
    productVariantRestrictions: parseProductVariantRestrictions({
      formData,
      productIds,
      inputNamePrefix: "mixProductVariantOptionIds",
    }),
    modifierGroupOverrides: parseProductModifierGroupOverrides({
      formData,
      productIds,
      inputNamePrefix: "mixModifierIncludedCount",
      fieldLabel: "Mix included count",
    }),
  }
}

function parseDealComponents(formData: FormData): DealComponentInput[] {
  const componentCount = parseInteger(formData.get("componentCount"), "Component count")

  if (componentCount <= 0) {
    throw new Error("Orderable deals require at least one component.")
  }

  const components: DealComponentInput[] = []

  for (let index = 0; index < componentCount; index += 1) {
    const label = parseRequiredString(
      formData.get(`componentLabel-${index}`),
      "Component label"
    )
    const sortOrder = parseInteger(
      formData.get(`componentSortOrder-${index}`),
      "Component sort order"
    )
    const requiredQuantity = parseInteger(
      formData.get(`componentRequiredQuantity-${index}`),
      "Component required quantity"
    )
    const minQuantity = parseInteger(
      formData.get(`componentMinQuantity-${index}`),
      "Component minimum quantity"
    )
    const maxQuantity = parseInteger(
      formData.get(`componentMaxQuantity-${index}`),
      "Component maximum quantity"
    )
    const pricingMode = parseComponentPricingMode(
      formData.get(`componentPricingMode-${index}`)
    )
    const fixedPrice = parseOptionalNonnegativeNumber(
      formData.get(`componentFixedPrice-${index}`),
      "Component fixed price"
    )
    const productIds = parseIdList(formData, `componentProductIds-${index}`)
    const uniqueProductIds = [...new Set(productIds)]
    const productVariantRestrictions = parseProductVariantRestrictions({
      formData,
      productIds: uniqueProductIds,
      inputNamePrefix: `componentProductVariantOptionIds-${index}`,
    })
    const modifierGroupOverrides = parseProductModifierGroupOverrides({
      formData,
      productIds: uniqueProductIds,
      inputNamePrefix: `componentModifierIncludedCount-${index}`,
      fieldLabel: "Deal included count",
    })

    if (requiredQuantity < 0 || minQuantity < 0 || maxQuantity < 0) {
      throw new Error("Component quantities must be zero or greater.")
    }

    if (minQuantity > requiredQuantity || requiredQuantity > maxQuantity) {
      throw new Error("Component quantity rules must be min <= required <= max.")
    }

    if (productIds.length === 0) {
      throw new Error(`${label} needs at least one allowed product.`)
    }

    if (pricingMode === "fixed_price" && fixedPrice === null) {
      throw new Error(`${label} needs a fixed component price.`)
    }

    components.push({
      label,
      description: parseOptionalString(
        formData.get(`componentDescription-${index}`)
      ),
      sortOrder,
      requiredQuantity,
      minQuantity,
      maxQuantity,
      pricingMode,
      fixedPrice: pricingMode === "fixed_price" ? fixedPrice : null,
      productIds: uniqueProductIds,
      productVariantRestrictions,
      modifierGroupOverrides,
    })
  }

  return components.sort((first, second) => first.sortOrder - second.sortOrder)
}

function parseAvailabilityWindows(formData: FormData) {
  if (formData.get("availabilityMode") !== "specific") return []

  const windows: SpecialAvailabilityWindow[] = []

  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
    if (formData.get(`availabilityDay-${dayOfWeek}`) !== "true") continue

    const isAllDay = formData.get(`availabilityAllDay-${dayOfWeek}`) === "true"
    const window: SpecialAvailabilityWindow = {
      dayOfWeek,
      isAllDay,
      startTime: isAllDay
        ? null
        : parseRequiredString(
            formData.get(`availabilityStart-${dayOfWeek}`),
            "Availability start time"
          ),
      endTime: isAllDay
        ? null
        : parseRequiredString(
            formData.get(`availabilityEnd-${dayOfWeek}`),
            "Availability end time"
          ),
    }

    if (!isAvailabilityWindowValid(window)) {
      throw new Error("Availability windows must be same-day valid windows.")
    }

    windows.push(window)
  }

  return windows
}

async function assertSpecial(businessId: string, specialId: string | null) {
  if (!specialId) return

  const { data, error } = await supabaseAdmin
    .from("specials")
    .select("id")
    .eq("id", specialId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Selected special could not be found.")
  }
}

async function assertProducts(businessId: string, productIds: string[]) {
  if (productIds.length === 0) return

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("business_id", businessId)
    .in("id", productIds)

  if (error) {
    throw new Error(`Could not validate products: ${error.message}`)
  }

  if ((data ?? []).length !== new Set(productIds).size) {
    throw new Error("One or more selected products are invalid.")
  }
}

async function assertMenuGroups(businessId: string, menuGroupIds: string[]) {
  if (menuGroupIds.length === 0) return

  const { data, error } = await supabaseAdmin
    .from("menu_groups")
    .select("id")
    .eq("business_id", businessId)
    .in("id", menuGroupIds)

  if (error) {
    throw new Error(`Could not validate menu groups: ${error.message}`)
  }

  if ((data ?? []).length !== new Set(menuGroupIds).size) {
    throw new Error("One or more selected categories are invalid.")
  }
}

async function assertVariantOptionsForProducts({
  businessId,
  restrictions,
}: {
  businessId: string
  restrictions: Array<{
    productId: string
    allowedVariantOptionIds: string[]
  }>
}) {
  const variantOptionIds = [
    ...new Set(restrictions.flatMap((item) => item.allowedVariantOptionIds)),
  ]

  if (variantOptionIds.length === 0) return

  const { data: options, error: optionError } = await supabaseAdmin
    .from("variant_group_options")
    .select("id, variant_group_id")
    .eq("business_id", businessId)
    .in("id", variantOptionIds)

  if (optionError) {
    throw new Error(`Could not validate variant options: ${optionError.message}`)
  }

  if ((options ?? []).length !== variantOptionIds.length) {
    throw new Error("One or more selected variant options are invalid.")
  }

  const variantGroupByOptionId = new Map(
    (options ?? []).map((option) => [
      option.id as string,
      option.variant_group_id as string,
    ])
  )
  const productIds = [...new Set(restrictions.map((item) => item.productId))]
  const { data: productVariantGroups, error: productVariantGroupError } =
    await supabaseAdmin
      .from("product_variant_groups")
      .select("product_id, variant_group_id")
      .eq("business_id", businessId)
      .in("product_id", productIds)

  if (productVariantGroupError) {
    throw new Error(
      `Could not validate product variants: ${productVariantGroupError.message}`
    )
  }

  const assignedVariantGroupsByProductId = new Map<string, Set<string>>()

  ;(productVariantGroups ?? []).forEach((row) => {
    const productId = row.product_id as string
    const variantGroupId = row.variant_group_id as string
    const current = assignedVariantGroupsByProductId.get(productId) ?? new Set()
    current.add(variantGroupId)
    assignedVariantGroupsByProductId.set(productId, current)
  })

  for (const restriction of restrictions) {
    const assignedVariantGroups =
      assignedVariantGroupsByProductId.get(restriction.productId) ?? new Set()

    for (const variantOptionId of restriction.allowedVariantOptionIds) {
      const variantGroupId = variantGroupByOptionId.get(variantOptionId)

      if (!variantGroupId || !assignedVariantGroups.has(variantGroupId)) {
        throw new Error(
          "One or more selected variant options are invalid for the selected product."
        )
      }
    }
  }
}

async function assertModifierGroupsForProducts({
  businessId,
  overrides,
}: {
  businessId: string
  overrides: Array<{
    productId: string
    modifierGroupId: string
  }>
}) {
  if (overrides.length === 0) return

  const modifierGroupIds = [
    ...new Set(overrides.map((override) => override.modifierGroupId)),
  ]
  const { data: modifierGroups, error: modifierGroupError } = await supabaseAdmin
    .from("modifier_groups")
    .select("id")
    .eq("business_id", businessId)
    .in("id", modifierGroupIds)

  if (modifierGroupError) {
    throw new Error(
      `Could not validate modifier groups: ${modifierGroupError.message}`
    )
  }

  if ((modifierGroups ?? []).length !== modifierGroupIds.length) {
    throw new Error("One or more selected modifier groups are invalid.")
  }

  const productIds = [...new Set(overrides.map((override) => override.productId))]
  const { data: assignments, error: assignmentError } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("product_id, modifier_group_id")
    .eq("business_id", businessId)
    .in("product_id", productIds)
    .in("modifier_group_id", modifierGroupIds)

  if (assignmentError) {
    throw new Error(
      `Could not validate product modifier groups: ${assignmentError.message}`
    )
  }

  const assignedKeys = new Set(
    (assignments ?? []).map(
      (assignment) =>
        `${assignment.product_id as string}:${assignment.modifier_group_id as string}`
    )
  )

  for (const override of overrides) {
    if (!assignedKeys.has(`${override.productId}:${override.modifierGroupId}`)) {
      throw new Error(
        "One or more modifier override groups are not assigned to the selected product."
      )
    }
  }
}

async function replaceEligibilityRows({
  businessId,
  specialId,
  productIds,
  menuGroupIds,
  availabilityWindows,
}: {
  businessId: string
  specialId: string
  productIds: string[]
  menuGroupIds: string[]
  availabilityWindows: SpecialAvailabilityWindow[]
}) {
  const deleteResults = await Promise.all([
    supabaseAdmin
      .from("special_products")
      .delete()
      .eq("business_id", businessId)
      .eq("special_id", specialId),
    supabaseAdmin
      .from("special_menu_groups")
      .delete()
      .eq("business_id", businessId)
      .eq("special_id", specialId),
    supabaseAdmin
      .from("special_availability_windows")
      .delete()
      .eq("business_id", businessId)
      .eq("special_id", specialId),
  ])

  const deleteError = deleteResults.find((result) => result.error)?.error
  if (deleteError) {
    throw new Error(`Could not replace special settings: ${deleteError.message}`)
  }

  if (productIds.length > 0) {
    const { error } = await supabaseAdmin.from("special_products").insert(
      [...new Set(productIds)].map((productId) => ({
        business_id: businessId,
        special_id: specialId,
        product_id: productId,
      }))
    )

    if (error) {
      throw new Error(`Could not save special products: ${error.message}`)
    }
  }

  if (menuGroupIds.length > 0) {
    const { error } = await supabaseAdmin.from("special_menu_groups").insert(
      [...new Set(menuGroupIds)].map((menuGroupId) => ({
        business_id: businessId,
        special_id: specialId,
        menu_group_id: menuGroupId,
      }))
    )

    if (error) {
      throw new Error(`Could not save special categories: ${error.message}`)
    }
  }

  if (availabilityWindows.length > 0) {
    const { error } = await supabaseAdmin
      .from("special_availability_windows")
      .insert(
        availabilityWindows.map((window) => ({
          business_id: businessId,
          special_id: specialId,
          day_of_week: window.dayOfWeek,
          start_time: window.startTime,
          end_time: window.endTime,
          is_all_day: window.isAllDay,
        }))
      )

    if (error) {
      throw new Error(`Could not save availability windows: ${error.message}`)
    }
  }
}

async function replaceDealComponents({
  businessId,
  specialId,
  components,
}: {
  businessId: string
  specialId: string
  components: DealComponentInput[]
}) {
  const { data: existingComponents, error: loadError } = await supabaseAdmin
    .from("special_components")
    .select("id")
    .eq("business_id", businessId)
    .eq("special_id", specialId)

  if (loadError) {
    throw new Error(`Could not load deal components: ${loadError.message}`)
  }

  const existingComponentIds = (existingComponents ?? []).map(
    (component) => component.id as string
  )

  if (existingComponentIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("special_components")
      .delete()
      .eq("business_id", businessId)
      .eq("special_id", specialId)

    if (error) {
      throw new Error(`Could not replace deal components: ${error.message}`)
    }
  }

  for (const component of components) {
    const { data, error } = await supabaseAdmin
      .from("special_components")
      .insert({
        business_id: businessId,
        special_id: specialId,
        label: component.label,
        description: component.description,
        sort_order: component.sortOrder,
        required_quantity: component.requiredQuantity,
        min_quantity: component.minQuantity,
        max_quantity: component.maxQuantity,
        pricing_behavior: "included_base",
        pricing_mode: component.pricingMode,
        fixed_price: component.fixedPrice,
        is_required: true,
      })
      .select("id")
      .single()

    if (error || !data) {
      throw new Error(`Could not save deal component: ${error?.message}`)
    }

    const componentId = data.id as string
    const componentProductIds = new Set<string>()
    for (const [productIndex, productId] of component.productIds.entries()) {
      const { data: componentProduct, error: productError } = await supabaseAdmin
        .from("special_component_products")
        .insert({
          business_id: businessId,
          special_component_id: componentId,
          product_id: productId,
          sort_order: productIndex + 1,
        })
        .select("id")
        .single()

      if (productError || !componentProduct) {
        throw new Error(
          `Could not save deal component products: ${productError?.message}`
        )
      }

      componentProductIds.add(productId)

      const allowedVariantOptionIds =
        component.productVariantRestrictions.find(
          (restriction) => restriction.productId === productId
        )?.allowedVariantOptionIds ?? []

      if (allowedVariantOptionIds.length > 0) {
        const { error: variantError } = await supabaseAdmin
          .from("special_component_product_variant_options")
          .insert(
            allowedVariantOptionIds.map((variantOptionId) => ({
              business_id: businessId,
              special_component_product_id: componentProduct.id as string,
              special_component_id: componentId,
              product_id: productId,
              variant_group_option_id: variantOptionId,
            }))
          )

        if (variantError) {
          throw new Error(
            `Could not save deal component variant restrictions: ${variantError.message}`
          )
        }
      }
    }

    const modifierOverrides = component.modifierGroupOverrides.filter(
      (override) => componentProductIds.has(override.productId)
    )

    if (modifierOverrides.length > 0) {
      const { error: overrideError } = await supabaseAdmin
        .from("special_component_modifier_group_overrides")
        .insert(
          modifierOverrides.map((override) => ({
            business_id: businessId,
            special_component_id: componentId,
            product_id: override.productId,
            modifier_group_id: override.modifierGroupId,
            included_selection_count: override.includedSelectionCount,
          }))
        )

      if (overrideError) {
        throw new Error(
          `Could not save deal modifier overrides: ${overrideError.message}`
        )
      }
    }
  }
}

async function replaceMixMatchRows({
  businessId,
  specialId,
  mixMatch,
}: {
  businessId: string
  specialId: string
  mixMatch: MixMatchInput | null
}) {
  const deleteResults = await Promise.all([
    supabaseAdmin
      .from("special_mix_match_products")
      .delete()
      .eq("business_id", businessId)
      .eq("special_id", specialId),
    supabaseAdmin
      .from("special_mix_match_rules")
      .delete()
      .eq("business_id", businessId)
      .eq("special_id", specialId),
  ])

  const deleteError = deleteResults.find((result) => result.error)?.error
  if (deleteError) {
    throw new Error(`Could not replace mix and match settings: ${deleteError.message}`)
  }

  if (!mixMatch) return

  const { error: ruleError } = await supabaseAdmin
    .from("special_mix_match_rules")
    .insert({
      business_id: businessId,
      special_id: specialId,
      min_quantity: mixMatch.minQuantity,
      max_quantity: mixMatch.maxQuantity,
      unit_price: mixMatch.unitPrice,
      allow_extra_items: mixMatch.allowExtraItems,
    })

  if (ruleError) {
    throw new Error(`Could not save mix and match rule: ${ruleError.message}`)
  }

  for (const [productIndex, productId] of mixMatch.productIds.entries()) {
    const { data: mixProduct, error: productError } = await supabaseAdmin
      .from("special_mix_match_products")
      .insert({
        business_id: businessId,
        special_id: specialId,
        product_id: productId,
        sort_order: productIndex + 1,
      })
      .select("id")
      .single()

    if (productError || !mixProduct) {
      throw new Error(`Could not save mix pool products: ${productError?.message}`)
    }

    const mixProductId = mixProduct.id as string
    const allowedVariantOptionIds =
      mixMatch.productVariantRestrictions.find(
        (restriction) => restriction.productId === productId
      )?.allowedVariantOptionIds ?? []

    if (allowedVariantOptionIds.length > 0) {
      const { error: variantError } = await supabaseAdmin
        .from("special_mix_match_product_variant_options")
        .insert(
          allowedVariantOptionIds.map((variantOptionId) => ({
            business_id: businessId,
            special_id: specialId,
            special_mix_match_product_id: mixProductId,
            product_id: productId,
            variant_group_option_id: variantOptionId,
          }))
        )

      if (variantError) {
        throw new Error(
          `Could not save mix variant restrictions: ${variantError.message}`
        )
      }
    }

    const modifierOverrides = mixMatch.modifierGroupOverrides.filter(
      (override) => override.productId === productId
    )

    if (modifierOverrides.length > 0) {
      const { error: overrideError } = await supabaseAdmin
        .from("special_mix_match_modifier_group_overrides")
        .insert(
          modifierOverrides.map((override) => ({
            business_id: businessId,
            special_id: specialId,
            special_mix_match_product_id: mixProductId,
            product_id: productId,
            modifier_group_id: override.modifierGroupId,
            included_selection_count: override.includedSelectionCount,
          }))
        )

      if (overrideError) {
        throw new Error(
          `Could not save mix modifier overrides: ${overrideError.message}`
        )
      }
    }
  }
}

export async function saveSpecial(formData: FormData) {
  const context = await resolveSpecialAdminActionContext(formData)
  const specialId = parseOptionalString(formData.get("specialId"))
  const payload = parseSpecialPayload(formData)
  const isOrderableDeal = payload.special_type === "orderable_deal"
  const isMixAndMatch = payload.special_type === "mix_and_match_fixed_unit_price"
  const components = isOrderableDeal ? parseDealComponents(formData) : []
  const mixMatch = isMixAndMatch ? parseMixMatchInput(formData) : null
  const productIds = isOrderableDeal || isMixAndMatch ? [] : parseIdList(formData, "productIds")
  const menuGroupIds = isOrderableDeal || isMixAndMatch
    ? []
    : parseIdList(formData, "menuGroupIds")
  const componentProductIds = components.flatMap((component) => component.productIds)
  const componentVariantRestrictions = components.flatMap(
    (component) => component.productVariantRestrictions
  )
  const componentModifierGroupOverrides = components.flatMap(
    (component) => component.modifierGroupOverrides
  )
  const mixProductIds = mixMatch?.productIds ?? []
  const mixVariantRestrictions = mixMatch?.productVariantRestrictions ?? []
  const mixModifierGroupOverrides = mixMatch?.modifierGroupOverrides ?? []
  const availabilityWindows = parseAvailabilityWindows(formData)
  const listHref = getSpecialAdminBaseHref(context.businessSlug)

  await assertSpecial(context.businessId, specialId)
  await assertProducts(context.businessId, productIds)
  await assertProducts(context.businessId, componentProductIds)
  await assertProducts(context.businessId, mixProductIds)
  await assertVariantOptionsForProducts({
    businessId: context.businessId,
    restrictions: [...componentVariantRestrictions, ...mixVariantRestrictions],
  })
  await assertModifierGroupsForProducts({
    businessId: context.businessId,
    overrides: [
      ...componentModifierGroupOverrides,
      ...mixModifierGroupOverrides,
    ],
  })
  await assertMenuGroups(context.businessId, menuGroupIds)

  let savedSpecialId = specialId
  let createdSpecialId: string | null = null

  if (specialId) {
    const { error } = await supabaseAdmin
      .from("specials")
      .update(payload)
      .eq("id", specialId)
      .eq("business_id", context.businessId)

    if (error) {
      throw new Error(`Could not update special: ${error.message}`)
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from("specials")
      .insert({
        business_id: context.businessId,
        ...payload,
      })
      .select("id")
      .single()

    if (error || !data) {
      throw new Error(`Could not create special: ${error?.message}`)
    }

    savedSpecialId = data.id as string
    createdSpecialId = savedSpecialId
  }

  if (!savedSpecialId) {
    throw new Error("Could not save special.")
  }

  try {
    await replaceEligibilityRows({
      businessId: context.businessId,
      specialId: savedSpecialId,
      productIds,
      menuGroupIds,
      availabilityWindows,
    })
    if (isOrderableDeal) {
      await replaceDealComponents({
        businessId: context.businessId,
        specialId: savedSpecialId,
        components,
      })
    } else {
      await replaceDealComponents({
        businessId: context.businessId,
        specialId: savedSpecialId,
        components: [],
      })
    }
    await replaceMixMatchRows({
      businessId: context.businessId,
      specialId: savedSpecialId,
      mixMatch,
    })
  } catch (error) {
    if (createdSpecialId) {
      await supabaseAdmin
        .from("specials")
        .delete()
        .eq("business_id", context.businessId)
        .eq("id", createdSpecialId)
    }

    throw error
  }

  revalidatePath(listHref)
  revalidatePath(
    `/businesses/${encodeURIComponent(context.businessSlug)}/admin`
  )
  redirect(listHref)
}
