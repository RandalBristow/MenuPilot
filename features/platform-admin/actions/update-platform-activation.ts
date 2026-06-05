"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  resolveBusinessContext,
  resolveBusinessContextById,
} from "@/features/tenant/queries/resolve-business-context"
import {
  resolveLocationContext,
  resolveLocationContextById,
} from "@/features/tenant/queries/resolve-location-context"

const allowedStatuses = ["setup", "active", "paused", "archived"] as const

export type PlatformActivationStatus = (typeof allowedStatuses)[number]

export type PlatformActivationActionState =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      error: string
    }

const initialError: PlatformActivationActionState = {
  ok: false,
  error: "",
}

function parseText(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null
}

function parseStatus(value: FormDataEntryValue | null) {
  const status = parseText(value)

  if (status && allowedStatuses.includes(status as PlatformActivationStatus)) {
    return status as PlatformActivationStatus
  }

  return null
}

function parseCheckbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true"
}

function success(message: string): PlatformActivationActionState {
  return { ok: true, message }
}

function error(message: string): PlatformActivationActionState {
  return { ok: false, error: message }
}

function getBusinessScopedPaths(businessSlug: string) {
  const slug = encodeURIComponent(businessSlug)

  return [
    `/businesses/${slug}/admin`,
    `/businesses/${slug}/menu`,
    `/businesses/${slug}/checkout`,
  ]
}

function revalidateBusinessPaths({
  businessId,
  businessSlug,
}: {
  businessId: string
  businessSlug: string
}) {
  revalidatePath("/platform/businesses")
  revalidatePath(`/platform/businesses/${businessId}`)

  getBusinessScopedPaths(businessSlug).forEach((path) => revalidatePath(path))
}

function revalidateLocationPaths({
  businessId,
  businessSlug,
  locationSlug,
}: {
  businessId: string
  businessSlug: string
  locationSlug: string
}) {
  revalidateBusinessPaths({ businessId, businessSlug })
  revalidatePath(
    `/businesses/${encodeURIComponent(
      businessSlug
    )}/locations/${encodeURIComponent(locationSlug)}/orders`
  )
}

async function updateBusinessStatusRecord({
  businessId,
  status,
}: {
  businessId: string
  status: PlatformActivationStatus
}) {
  const { error: updateError } = await supabaseAdmin
    .from("businesses")
    .update({ status })
    .eq("id", businessId)

  if (updateError) {
    throw new Error(`Could not update business status: ${updateError.message}`)
  }
}

async function updateLocationSettingsRecord({
  businessId,
  locationId,
  status,
  isEnabled,
  acceptingOrders,
  pickupEnabled,
  deliveryEnabled,
}: {
  businessId: string
  locationId: string
  status: PlatformActivationStatus
  isEnabled: boolean
  acceptingOrders: boolean
  pickupEnabled: boolean
  deliveryEnabled: boolean
}) {
  const { error: updateError } = await supabaseAdmin
    .from("locations")
    .update({
      status,
      is_enabled: isEnabled,
      accepting_orders: acceptingOrders,
      pickup_enabled: pickupEnabled,
      delivery_enabled: deliveryEnabled,
    })
    .eq("id", locationId)
    .eq("business_id", businessId)

  if (updateError) {
    throw new Error(
      `Could not update location ordering settings: ${updateError.message}`
    )
  }
}

export async function updatePlatformBusinessStatus(
  _previousState: PlatformActivationActionState = initialError,
  formData: FormData
): Promise<PlatformActivationActionState> {
  void _previousState

  const businessId = parseText(formData.get("businessId"))
  const businessSlug = parseText(formData.get("businessSlug"))
  const status = parseStatus(formData.get("status"))

  if (!status) {
    return error("Choose a valid business status.")
  }

  try {
    const business = businessSlug
      ? await resolveBusinessContext({ businessSlug })
      : businessId
        ? await resolveBusinessContextById({ businessId })
        : null

    if (!business) {
      return error("Could not find that business.")
    }

    if (businessId && business.id !== businessId) {
      return error("Business context did not match.")
    }

    await updateBusinessStatusRecord({
      businessId: business.id,
      status,
    })
    revalidateBusinessPaths({
      businessId: business.id,
      businessSlug: business.slug,
    })

    return success("Business status updated.")
  } catch (caughtError) {
    return error(
      caughtError instanceof Error
        ? caughtError.message
        : "Could not update business status."
    )
  }
}

export async function updatePlatformLocationSettings(
  _previousState: PlatformActivationActionState = initialError,
  formData: FormData
): Promise<PlatformActivationActionState> {
  void _previousState

  const businessId = parseText(formData.get("businessId"))
  const businessSlug = parseText(formData.get("businessSlug"))
  const locationId = parseText(formData.get("locationId"))
  const locationSlug = parseText(formData.get("locationSlug"))
  const status = parseStatus(formData.get("status"))

  if (!status) {
    return error("Choose a valid location status.")
  }

  try {
    const business = businessSlug
      ? await resolveBusinessContext({ businessSlug })
      : businessId
        ? await resolveBusinessContextById({ businessId })
        : null

    if (!business) {
      return error("Could not find that business.")
    }

    if (businessId && business.id !== businessId) {
      return error("Business context did not match.")
    }

    const location = locationSlug
      ? await resolveLocationContext({
          businessId: business.id,
          locationSlug,
        })
      : locationId
        ? await resolveLocationContextById({
            businessId: business.id,
            locationId,
          })
        : null

    if (!location) {
      return error("Could not find that location for this business.")
    }

    if (locationId && location.id !== locationId) {
      return error("Location context did not match.")
    }

    const isEnabled = parseCheckbox(formData.get("isEnabled"))
    const pickupEnabled = parseCheckbox(formData.get("pickupEnabled"))
    const deliveryEnabled = parseCheckbox(formData.get("deliveryEnabled"))
    const requestedAcceptingOrders = parseCheckbox(
      formData.get("acceptingOrders")
    )
    const acceptingOrders =
      requestedAcceptingOrders &&
      status === "active" &&
      isEnabled &&
      (pickupEnabled || deliveryEnabled)

    await updateLocationSettingsRecord({
      businessId: business.id,
      locationId: location.id,
      status,
      isEnabled,
      acceptingOrders,
      pickupEnabled,
      deliveryEnabled,
    })
    revalidateLocationPaths({
      businessId: business.id,
      businessSlug: business.slug,
      locationSlug: location.slug,
    })

    return success("Location ordering settings updated.")
  } catch (caughtError) {
    return error(
      caughtError instanceof Error
        ? caughtError.message
        : "Could not update location ordering settings."
    )
  }
}
