import type {
  RawTenantBusiness,
  RawTenantLocation,
  TenantContextStore,
} from "@/features/tenant/types/tenant-context"

const BUSINESS_SELECT = `
  id,
  slug,
  name,
  status,
  primary_contact_name,
  primary_contact_email,
  primary_phone
`

const LOCATION_SELECT = `
  id,
  business_id,
  slug,
  name,
  status,
  is_enabled,
  accepting_orders,
  pickup_enabled,
  delivery_enabled,
  timezone,
  created_at
`

function maybeSingleOrThrow<T>({
  data,
  error,
  message,
}: {
  data: T | null
  error: { code?: string; message: string } | null
  message: string
}) {
  if (error) {
    throw new Error(`${message}: ${error.message}`)
  }

  return data
}

async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import("@/lib/supabase/admin")

  return supabaseAdmin
}

export const supabaseTenantContextStore: TenantContextStore = {
  async findBusinessBySlug(slug) {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select(BUSINESS_SELECT)
      .eq("slug", slug)
      .maybeSingle()

    return maybeSingleOrThrow<RawTenantBusiness>({
      data: data as RawTenantBusiness | null,
      error,
      message: "Could not resolve business",
    })
  },

  async findBusinessById(id) {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select(BUSINESS_SELECT)
      .eq("id", id)
      .maybeSingle()

    return maybeSingleOrThrow<RawTenantBusiness>({
      data: data as RawTenantBusiness | null,
      error,
      message: "Could not resolve business",
    })
  },

  async findLocationBySlug({ businessId, locationSlug }) {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("locations")
      .select(LOCATION_SELECT)
      .eq("business_id", businessId)
      .eq("slug", locationSlug)
      .maybeSingle()

    return maybeSingleOrThrow<RawTenantLocation>({
      data: data as RawTenantLocation | null,
      error,
      message: "Could not resolve location",
    })
  },

  async findLocationById({ businessId, locationId }) {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("locations")
      .select(LOCATION_SELECT)
      .eq("business_id", businessId)
      .eq("id", locationId)
      .maybeSingle()

    return maybeSingleOrThrow<RawTenantLocation>({
      data: data as RawTenantLocation | null,
      error,
      message: "Could not resolve location",
    })
  },

  async listLocationsForBusiness(businessId) {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("locations")
      .select(LOCATION_SELECT)
      .eq("business_id", businessId)

    if (error) {
      throw new Error(`Could not resolve business locations: ${error.message}`)
    }

    return (data ?? []) as RawTenantLocation[]
  },
}
