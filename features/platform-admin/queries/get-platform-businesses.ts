import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  mapPlatformBusinessDetail,
  mapPlatformBusinessListItem,
  type RawBusinessDetail,
  type RawBusinessListItem,
} from "@/features/platform-admin/utils/platform-business-mappers"

export async function getPlatformBusinesses() {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      status,
      legal_name,
      primary_contact_name,
      primary_contact_email,
      primary_phone,
      locations (
        id,
        name,
        slug,
        status
      )
    `
    )
    .order("name", { ascending: true })

  if (error) {
    throw new Error(`Could not load platform businesses: ${error.message}`)
  }

  return ((data ?? []) as RawBusinessListItem[]).map(
    mapPlatformBusinessListItem
  )
}

export async function getPlatformBusinessDetail(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      status,
      legal_name,
      description,
      primary_contact_name,
      primary_contact_email,
      primary_phone,
      locations (
        id,
        name,
        slug,
        status,
        is_enabled,
        accepting_orders,
        pickup_enabled,
        delivery_enabled,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        phone,
        email,
        timezone
      )
    `
    )
    .eq("id", businessId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load platform business: ${error.message}`)
  }

  return data ? mapPlatformBusinessDetail(data as RawBusinessDetail) : null
}
