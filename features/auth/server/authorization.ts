import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getWorkforceIdentity, isPlatformOwnerEmail } from "@/features/auth/server/identity"
import type { WorkforceRole } from "@/features/auth/types/auth"

function loginRedirect(next: string): never {
  redirect(`/login?next=${encodeURIComponent(next)}`)
}

export async function requirePlatformOwner(next = "/platform") {
  const identity = await getWorkforceIdentity()
  if (!identity) loginRedirect(next)
  if (identity.development?.role === "platform" || isPlatformOwnerEmail(identity.email)) return identity
  redirect("/unauthorized")
}

export async function requireBusinessAccess({
  businessSlug,
  roles,
  next,
}: {
  businessSlug: string
  roles: WorkforceRole[]
  next: string
}) {
  const identity = await getWorkforceIdentity()
  if (!identity) loginRedirect(next)

  if (identity.development) {
    if (identity.development.businessSlug === businessSlug && roles.includes(identity.development.role)) return identity
    if (identity.development.role === "platform") return identity
    redirect("/unauthorized")
  }

  if (isPlatformOwnerEmail(identity.email)) return identity
  const { data: business } = await supabaseAdmin.from("businesses").select("id").eq("slug", businessSlug).single()
  if (!business) redirect("/unauthorized")
  const { data: membership } = await supabaseAdmin
    .from("business_users")
    .select("role, is_enabled")
    .eq("business_id", business.id)
    .eq("user_id", identity.userId!)
    .single()
  if (!membership?.is_enabled || !roles.includes(membership.role as WorkforceRole)) redirect("/unauthorized")
  return identity
}

export async function requireLocationAccess({
  businessSlug,
  locationSlug,
  roles,
  next,
}: {
  businessSlug: string
  locationSlug: string
  roles: WorkforceRole[]
  next: string
}) {
  const identity = await getWorkforceIdentity()
  if (!identity) loginRedirect(next)

  if (identity.development) {
    const dev = identity.development
    if (dev.role === "platform") return identity
    if (dev.businessSlug === businessSlug && ["owner", "admin"].includes(dev.role) && roles.includes(dev.role)) return identity
    if (dev.businessSlug === businessSlug && dev.locationSlug === locationSlug && roles.includes(dev.role)) return identity
    redirect("/unauthorized")
  }

  if (isPlatformOwnerEmail(identity.email)) return identity
  const { data: location } = await supabaseAdmin
    .from("locations")
    .select("id, business_id, businesses!inner(slug)")
    .eq("slug", locationSlug)
    .eq("businesses.slug", businessSlug)
    .single()
  if (!location) redirect("/unauthorized")

  const { data: businessMembership } = await supabaseAdmin
    .from("business_users")
    .select("role, is_enabled")
    .eq("business_id", location.business_id)
    .eq("user_id", identity.userId!)
    .single()
  const businessRole = businessMembership?.role as WorkforceRole | undefined
  if (businessMembership?.is_enabled && businessRole && ["owner", "admin"].includes(businessRole) && roles.includes(businessRole)) return identity

  const { data: assignment } = await supabaseAdmin
    .from("location_users")
    .select("role, is_enabled")
    .eq("location_id", location.id)
    .eq("user_id", identity.userId!)
    .single()
  if (!assignment?.is_enabled || !roles.includes(assignment.role as WorkforceRole)) redirect("/unauthorized")
  return identity
}
