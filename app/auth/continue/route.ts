import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getWorkforceIdentity, isPlatformOwnerEmail } from "@/features/auth/server/identity"

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null
}

export async function GET(request: NextRequest) {
  const identity = await getWorkforceIdentity()
  if (!identity) return NextResponse.redirect(new URL("/login", request.url))
  const requested = safeNext(request.nextUrl.searchParams.get("next"))
  if (requested) return NextResponse.redirect(new URL(requested, request.url))
  if (identity.development?.role === "platform" || isPlatformOwnerEmail(identity.email)) return NextResponse.redirect(new URL("/platform", request.url))
  if (identity.development) {
    const dev = identity.development
    if ((dev.role === "owner" || dev.role === "admin") && dev.businessSlug) return NextResponse.redirect(new URL(`/businesses/${dev.businessSlug}/admin`, request.url))
    if (dev.role === "manager" && dev.businessSlug && dev.locationSlug) return NextResponse.redirect(new URL(`/businesses/${dev.businessSlug}/locations/${dev.locationSlug}/manager`, request.url))
    if (dev.role === "staff" && dev.businessSlug && dev.locationSlug) return NextResponse.redirect(new URL(`/businesses/${dev.businessSlug}/locations/${dev.locationSlug}/orders`, request.url))
  }

  const { data: memberships } = await supabaseAdmin
    .from("business_users")
    .select("business_id, role, businesses(slug)")
    .eq("user_id", identity.userId!)
    .eq("is_enabled", true)
  if ((memberships?.length ?? 0) !== 1) return NextResponse.redirect(new URL("/access", request.url))
  const membership = memberships![0] as unknown as { business_id: string; role: string; businesses: { slug: string } | null }
  const businessSlug = membership.businesses?.slug
  if (!businessSlug) return NextResponse.redirect(new URL("/access", request.url))
  if (membership.role === "owner" || membership.role === "admin") return NextResponse.redirect(new URL(`/businesses/${businessSlug}/admin`, request.url))
  const { data: locationAssignments } = await supabaseAdmin
    .from("location_users")
    .select("role, is_enabled, locations(slug)")
    .eq("business_id", membership.business_id)
    .eq("user_id", identity.userId!)
    .eq("is_enabled", true)
  const locations = (locationAssignments ?? []) as unknown as Array<{ role: string; is_enabled: boolean; locations: { slug: string } | null }>
  if (locations.length !== 1 || !locations[0].locations?.slug) return NextResponse.redirect(new URL("/access", request.url))
  const locationSlug = locations[0].locations.slug
  return NextResponse.redirect(new URL(membership.role === "manager" ? `/businesses/${businessSlug}/locations/${locationSlug}/manager` : `/businesses/${businessSlug}/locations/${locationSlug}/orders`, request.url))
}
