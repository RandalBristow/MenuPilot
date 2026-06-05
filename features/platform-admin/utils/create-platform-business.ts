export type PlatformBusinessCreateResult =
  | {
      ok: true
      businessId: string
    }
  | {
      ok: false
      error: string
    }

export type PlatformBusinessInsertPayload = {
  name: string
  slug: string
  legal_name: string | null
  description: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_phone: string | null
  status: "setup"
}

export type PlatformLocationInsertPayload = {
  business_id: string
  name: string
  slug: string
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  timezone: string
  status: "setup"
  is_enabled: false
  accepting_orders: false
  pickup_enabled: false
  delivery_enabled: false
}

export type PlatformBusinessCreatePayload = {
  business: PlatformBusinessInsertPayload
  location: Omit<PlatformLocationInsertPayload, "business_id">
}

export type PlatformBusinessCreateRepository = {
  findBusinessBySlug: (slug: string) => Promise<{ id: string } | null>
  insertBusiness: (
    business: PlatformBusinessInsertPayload
  ) => Promise<{ id: string }>
  insertLocation: (location: PlatformLocationInsertPayload) => Promise<void>
  deleteBusiness: (businessId: string) => Promise<void>
}

function parseRequiredString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

export function normalizePlatformSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function parseRequiredSlug(value: FormDataEntryValue | null, fieldName: string) {
  const rawSlug = parseRequiredString(value, fieldName)
  const slug = normalizePlatformSlug(rawSlug)

  if (!slug) {
    throw new Error(`${fieldName} must include letters or numbers.`)
  }

  return slug
}

export function buildPlatformBusinessCreatePayload(
  formData: FormData
): PlatformBusinessCreatePayload {
  const businessName = parseRequiredString(
    formData.get("businessName"),
    "Business name"
  )
  const businessSlug = parseRequiredSlug(
    formData.get("businessSlug"),
    "Business slug"
  )
  const locationName = parseRequiredString(
    formData.get("locationName"),
    "Location name"
  )
  const locationSlug = parseRequiredSlug(
    formData.get("locationSlug"),
    "Location slug"
  )

  return {
    business: {
      name: businessName,
      slug: businessSlug,
      legal_name: parseOptionalString(formData.get("legalName")),
      description: parseOptionalString(formData.get("description")),
      primary_contact_name: parseOptionalString(
        formData.get("primaryContactName")
      ),
      primary_contact_email: parseOptionalString(
        formData.get("primaryContactEmail")
      ),
      primary_phone: parseOptionalString(formData.get("primaryPhone")),
      status: "setup",
    },
    location: {
      name: locationName,
      slug: locationSlug,
      address_line1: parseOptionalString(formData.get("addressLine1")),
      address_line2: parseOptionalString(formData.get("addressLine2")),
      city: parseOptionalString(formData.get("city")),
      state: parseOptionalString(formData.get("state")),
      postal_code: parseOptionalString(formData.get("postalCode")),
      phone: parseOptionalString(formData.get("locationPhone")),
      email: parseOptionalString(formData.get("locationEmail")),
      timezone:
        parseOptionalString(formData.get("timezone")) ?? "America/New_York",
      status: "setup",
      is_enabled: false,
      accepting_orders: false,
      pickup_enabled: false,
      delivery_enabled: false,
    },
  }
}

export async function createPlatformBusinessWithLocationRecord(
  repository: PlatformBusinessCreateRepository,
  formData: FormData
): Promise<PlatformBusinessCreateResult> {
  let payload: PlatformBusinessCreatePayload

  try {
    payload = buildPlatformBusinessCreatePayload(formData)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid form data.",
    }
  }

  const existingBusiness = await repository.findBusinessBySlug(
    payload.business.slug
  )

  if (existingBusiness) {
    return {
      ok: false,
      error: "A business with that slug already exists.",
    }
  }

  let businessId: string | null = null

  try {
    const business = await repository.insertBusiness(payload.business)
    businessId = business.id

    await repository.insertLocation({
      business_id: businessId,
      ...payload.location,
    })

    return {
      ok: true,
      businessId,
    }
  } catch (error) {
    if (businessId) {
      try {
        await repository.deleteBusiness(businessId)
      } catch {
        return {
          ok: false,
          error:
            "Could not create the first location, and cleanup of the new business also failed.",
        }
      }
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not create business and location.",
    }
  }
}
