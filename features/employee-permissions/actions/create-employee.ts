"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  employeePermissionFields,
  type EmployeeRole,
} from "@/features/employee-permissions/types/employee-permission"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"

export type CreateEmployeeState = { ok: boolean; message: string }

function required(formData: FormData, name: string, label: string) {
  const value = String(formData.get(name) ?? "").trim()
  if (!value) throw new Error(`${label} is required.`)
  return value
}

async function findAuthUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (error) throw new Error(`Could not check existing users: ${error.message}`)
  return data.users.find((user) => user.email?.toLowerCase() === email) ?? null
}

export async function createEmployee(
  _previousState: CreateEmployeeState,
  formData: FormData
): Promise<CreateEmployeeState> {
  try {
    const businessSlug = required(formData, "businessSlug", "Business")
    const firstName = required(formData, "firstName", "First name")
    const lastName = required(formData, "lastName", "Last name")
    const email = required(formData, "email", "Email").toLowerCase()
    const phone = String(formData.get("phone") ?? "").trim() || null
    const locationIds = [...new Set(formData.getAll("locationIds").map(String))]
    if (locationIds.length === 0) return { ok: false, message: "Choose at least one location." }
    const role = required(formData, "role", "Role") as EmployeeRole
    if (role !== "manager" && role !== "staff") {
      return { ok: false, message: "Choose a valid employee role." }
    }

    const business = await resolveBusinessContext({ businessSlug })
    if (!business) return { ok: false, message: "Business could not be found." }
    const { data: locations, error: locationError } = await supabaseAdmin
      .from("locations")
      .select("id")
      .eq("business_id", business.id)
      .in("id", locationIds)
    if (locationError || (locations?.length ?? 0) !== locationIds.length) {
      return { ok: false, message: "One or more selected locations are invalid." }
    }

    let user = await findAuthUserByEmail(email)
    let invitationSent = false
    if (!user) {
      const requestHeaders = await headers()
      const origin = requestHeaders.get("origin") ?? `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`
      const invitation = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { first_name: firstName, last_name: lastName, display_name: `${firstName} ${lastName}` },
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
      })
      if (invitation.error || !invitation.data.user) {
        return { ok: false, message: `Could not invite employee: ${invitation.error?.message ?? "Unknown error"}` }
      }
      user = invitation.data.user
      invitationSent = true
    }

    const { data: existingBusinessUser } = await supabaseAdmin
      .from("business_users")
      .select("role")
      .eq("business_id", business.id)
      .eq("user_id", user.id)
      .maybeSingle()
    if (existingBusinessUser && !["manager", "staff"].includes(existingBusinessUser.role)) {
      return { ok: false, message: "This user already has a business owner or administrator role." }
    }

    const profileResult = await supabaseAdmin.from("profiles").upsert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`,
      phone,
    })
    if (profileResult.error) return { ok: false, message: `Could not save employee profile: ${profileResult.error.message}` }

    const businessUserResult = await supabaseAdmin.from("business_users").upsert(
      { business_id: business.id, user_id: user.id, role, is_enabled: true },
      { onConflict: "business_id,user_id" }
    )
    if (businessUserResult.error) return { ok: false, message: `Could not assign employee to business: ${businessUserResult.error.message}` }

    const { error: assignmentError } = await supabaseAdmin
      .from("location_users")
      .upsert(
        locationIds.map((locationId) => ({ business_id: business.id, location_id: locationId, user_id: user.id, role, is_enabled: true })),
        { onConflict: "location_id,user_id" }
      )
    if (assignmentError) return { ok: false, message: `Could not assign employee to locations: ${assignmentError.message}` }

    const permissionResult = await supabaseAdmin.from("employee_permissions").upsert(
      locationIds.map((locationId) => ({
        business_id: business.id,
        location_id: locationId,
        user_id: user.id,
        ...Object.fromEntries(
          employeePermissionFields.map((field) => [field, formData.get(field) === "true"])
        ),
      })),
      { onConflict: "location_id,user_id" }
    )
    if (permissionResult.error) return { ok: false, message: `Could not save employee permissions: ${permissionResult.error.message}` }

    revalidatePath(`/businesses/${business.slug}/admin/employees`)
    return {
      ok: true,
      message: invitationSent
        ? "Employee added and invitation sent."
        : "Existing user assigned as an employee.",
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not add employee." }
  }
}
