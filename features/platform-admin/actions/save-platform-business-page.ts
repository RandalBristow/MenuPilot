"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { normalizePlatformSlug } from "@/features/platform-admin/utils/create-platform-business"
import {
  mapBusinessPricingSettingsToRow,
  normalizeBusinessPricingSettings,
  type ServiceFeeType,
} from "@/lib/pricing/business-pricing-settings"

export type SavePlatformBusinessPageState = {
  ok: boolean
  message: string
}

const statuses = ["setup", "active", "paused", "archived"] as const

function text(formData: FormData, key: string) {
  const entry = formData.get(key)
  return typeof entry === "string" && entry.trim() ? entry.trim() : null
}

function required(formData: FormData, key: string, label: string) {
  const parsed = text(formData, key)
  if (!parsed) throw new Error(`${label} is required.`)
  return parsed
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "true"
}

function status(formData: FormData, key: string, label: string) {
  const parsed = text(formData, key)
  if (!parsed || !statuses.includes(parsed as (typeof statuses)[number])) {
    throw new Error(`${label} is not valid.`)
  }
  return parsed as (typeof statuses)[number]
}

function nonnegative(formData: FormData, key: string, label: string) {
  const parsed = Number(formData.get(key) ?? 0)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be 0 or greater.`)
  }
  return parsed
}

export async function savePlatformBusinessPage(
  _previous: SavePlatformBusinessPageState,
  formData: FormData
): Promise<SavePlatformBusinessPageState> {
  try {
    const businessId = required(formData, "businessId", "Business")
    const oldBusinessSlug = required(formData, "oldBusinessSlug", "Business slug")
    const businessName = required(formData, "businessName", "Business name")
    const businessSlug = normalizePlatformSlug(
      required(formData, "businessSlug", "Business slug")
    )
    const businessStatus = status(formData, "businessStatus", "Business status")
    const locationIds = formData.getAll("locationIds").filter((id): id is string => typeof id === "string")

    const locations = locationIds.map((locationId) => {
      const suffix = `_${locationId}`
      const locationStatus = status(formData, `locationStatus${suffix}`, "Location status")
      const pickupEnabled = checkbox(formData, `pickupEnabled${suffix}`)
      const deliveryEnabled = checkbox(formData, `deliveryEnabled${suffix}`)
      const requestedAccepting = checkbox(formData, `acceptingOrders${suffix}`)

      return {
        id: locationId,
        oldSlug: required(formData, `oldLocationSlug${suffix}`, "Location slug"),
        slug: normalizePlatformSlug(required(formData, `locationSlug${suffix}`, "Location slug")),
        name: required(formData, `locationName${suffix}`, "Location name"),
        status: locationStatus,
        acceptingOrders:
          requestedAccepting &&
          locationStatus === "active" &&
          (pickupEnabled || deliveryEnabled),
        pickupEnabled,
        deliveryEnabled,
        addressLine1: text(formData, `addressLine1${suffix}`),
        addressLine2: text(formData, `addressLine2${suffix}`),
        city: text(formData, `city${suffix}`),
        state: text(formData, `state${suffix}`),
        postalCode: text(formData, `postalCode${suffix}`),
        phone: text(formData, `locationPhone${suffix}`),
        email: text(formData, `locationEmail${suffix}`),
        timezone: text(formData, `timezone${suffix}`) ?? "America/New_York",
      }
    })

    const serviceFeeTypeValue = required(formData, "serviceFeeType", "Service fee type")
    const serviceFeeType: ServiceFeeType =
      serviceFeeTypeValue === "fixed" || serviceFeeTypeValue === "percentage"
        ? serviceFeeTypeValue
        : "none"
    const pricing = normalizeBusinessPricingSettings({
      pizzaHalfToppingPricingEnabled: checkbox(formData, "pizzaHalfToppingPricingEnabled"),
      pizzaHalfToppingIncludedWeightEnabled: checkbox(formData, "pizzaHalfToppingIncludedWeightEnabled"),
      pizzaHalfToppingRoundingMode: "floor_to_cent",
      salesTaxRatePercent: nonnegative(formData, "salesTaxRatePercent", "Sales tax rate"),
      serviceFeeType,
      serviceFeeValue: nonnegative(formData, "serviceFeeValue", "Service fee"),
      tipsEnabled: checkbox(formData, "tipsEnabled"),
    })

    const { data: duplicateBusiness, error: duplicateBusinessError } = await supabaseAdmin
      .from("businesses").select("id").eq("slug", businessSlug).neq("id", businessId).maybeSingle()
    if (duplicateBusinessError) throw new Error(duplicateBusinessError.message)
    if (duplicateBusiness) throw new Error("A business with that slug already exists.")

    for (const location of locations) {
      const { data: duplicateLocation, error: duplicateLocationError } = await supabaseAdmin
        .from("locations").select("id").eq("business_id", businessId).eq("slug", location.slug).neq("id", location.id).maybeSingle()
      if (duplicateLocationError) throw new Error(duplicateLocationError.message)
      if (duplicateLocation) throw new Error(`A location with the slug "${location.slug}" already exists.`)
    }

    const { error: businessError } = await supabaseAdmin.from("businesses").update({
      name: businessName,
      slug: businessSlug,
      status: businessStatus,
      legal_name: text(formData, "legalName"),
      description: text(formData, "description"),
      primary_contact_name: text(formData, "primaryContactName"),
      primary_contact_email: text(formData, "primaryContactEmail"),
      primary_phone: text(formData, "primaryPhone"),
    }).eq("id", businessId)
    if (businessError) throw new Error(`Could not save business details: ${businessError.message}`)

    for (const location of locations) {
      const { error: locationError } = await supabaseAdmin.from("locations").update({
        name: location.name,
        slug: location.slug,
        status: location.status,
        is_enabled: location.status === "active",
        accepting_orders: location.acceptingOrders,
        pickup_enabled: location.pickupEnabled,
        delivery_enabled: location.deliveryEnabled,
        address_line1: location.addressLine1,
        address_line2: location.addressLine2,
        city: location.city,
        state: location.state,
        postal_code: location.postalCode,
        phone: location.phone,
        email: location.email,
        timezone: location.timezone,
      }).eq("id", location.id).eq("business_id", businessId)
      if (locationError) throw new Error(`Could not save ${location.name}: ${locationError.message}`)
    }

    const { error: pricingError } = await supabaseAdmin.from("business_pricing_settings").upsert({
      business_id: businessId,
      ...mapBusinessPricingSettingsToRow(pricing),
    }, { onConflict: "business_id" })
    if (pricingError) throw new Error(`Could not save pricing settings: ${pricingError.message}`)

    revalidatePath("/platform/businesses")
    revalidatePath(`/platform/businesses/${businessId}`)
    revalidatePath(`/businesses/${oldBusinessSlug}/admin`)
    revalidatePath(`/businesses/${businessSlug}/admin`)
    revalidatePath(`/businesses/${businessSlug}/menu`)
    locations.forEach((location) => {
      revalidatePath(`/businesses/${businessSlug}/locations/${location.oldSlug}/orders`)
      revalidatePath(`/businesses/${businessSlug}/locations/${location.slug}/orders`)
    })

    return { ok: true, message: "Business configuration saved." }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save business configuration." }
  }
}
