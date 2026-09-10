"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { DEV_IDENTITY_COOKIE, isDevelopmentAccessEnabled } from "@/features/auth/server/identity"
import type { WorkforceRole } from "@/features/auth/types/auth"

export async function setDevelopmentAccess(formData: FormData) {
  if (!(await isDevelopmentAccessEnabled())) redirect("/login")
  const role = String(formData.get("role") ?? "") as WorkforceRole
  if (!["platform", "owner", "admin", "manager", "staff"].includes(role)) redirect("/dev/access?error=role")

  if (role === "platform") {
    ;(await cookies()).set(DEV_IDENTITY_COOKIE, JSON.stringify({ role }), { httpOnly: true, sameSite: "lax", path: "/" })
    redirect("/platform")
  }

  const businessId = String(formData.get("businessId") ?? "")
  const locationId = String(formData.get("locationId") ?? "")
  const { data: business } = await supabaseAdmin.from("businesses").select("id, slug").eq("id", businessId).single()
  if (!business) redirect("/dev/access?error=business")

  if (role === "owner" || role === "admin") {
    ;(await cookies()).set(DEV_IDENTITY_COOKIE, JSON.stringify({ role, businessId: business.id, businessSlug: business.slug }), { httpOnly: true, sameSite: "lax", path: "/" })
    redirect(`/businesses/${business.slug}/admin`)
  }

  const { data: location } = await supabaseAdmin.from("locations").select("id, slug").eq("id", locationId).eq("business_id", business.id).single()
  if (!location) redirect("/dev/access?error=location")
  ;(await cookies()).set(DEV_IDENTITY_COOKIE, JSON.stringify({ role, businessId: business.id, businessSlug: business.slug, locationId: location.id, locationSlug: location.slug }), { httpOnly: true, sameSite: "lax", path: "/" })
  redirect(role === "manager" ? `/businesses/${business.slug}/locations/${location.slug}/manager` : `/businesses/${business.slug}/locations/${location.slug}/orders`)
}
