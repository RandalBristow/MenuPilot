"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"

export type UpdateEmployeeDetailsState = { ok: boolean; message: string }

function required(formData: FormData, name: string, label: string) {
  const value = String(formData.get(name) ?? "").trim()
  if (!value) throw new Error(`${label} is required.`)
  return value
}

export async function updateEmployeeDetails(
  _previousState: UpdateEmployeeDetailsState,
  formData: FormData
): Promise<UpdateEmployeeDetailsState> {
  try {
    const businessSlug = required(formData, "businessSlug", "Business")
    const assignmentId = required(formData, "assignmentId", "Employee")
    const firstName = required(formData, "firstName", "First name")
    const lastName = required(formData, "lastName", "Last name")
    const email = required(formData, "email", "Email").toLowerCase()
    const phone = String(formData.get("phone") ?? "").trim() || null
    const locationId = required(formData, "locationId", "Location")
    const isEnabled = formData.get("isEnabled") === "true"

    const business = await resolveBusinessContext({ businessSlug })
    if (!business) return { ok: false, message: "Business could not be found." }
    const [{ data: assignment, error: assignmentError }, { data: location }] =
      await Promise.all([
        supabaseAdmin
          .from("location_users")
          .select("id, user_id, location_id")
          .eq("id", assignmentId)
          .eq("business_id", business.id)
          .in("role", ["manager", "staff"])
          .single(),
        supabaseAdmin
          .from("locations")
          .select("id")
          .eq("id", locationId)
          .eq("business_id", business.id)
          .single(),
      ])
    if (assignmentError || !assignment) {
      return { ok: false, message: "Employee assignment is invalid." }
    }
    if (!location) return { ok: false, message: "Selected location is invalid." }

    if (locationId !== assignment.location_id) {
      const { data: conflict } = await supabaseAdmin
        .from("location_users")
        .select("id")
        .eq("location_id", locationId)
        .eq("user_id", assignment.user_id)
        .maybeSingle()
      if (conflict) {
        return { ok: false, message: "This employee is already assigned to that location." }
      }
    }

    const authResult = await supabaseAdmin.auth.admin.updateUserById(
      assignment.user_id,
      {
        email,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`,
        },
      }
    )
    if (authResult.error) {
      return { ok: false, message: `Could not update employee login: ${authResult.error.message}` }
    }

    const profileResult = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        phone,
      })
      .eq("id", assignment.user_id)
    if (profileResult.error) {
      return { ok: false, message: `Could not update employee profile: ${profileResult.error.message}` }
    }

    const locationResult = await supabaseAdmin
      .from("location_users")
      .update({ location_id: locationId, is_enabled: isEnabled })
      .eq("id", assignment.id)
      .eq("business_id", business.id)
    if (locationResult.error) {
      return { ok: false, message: `Could not update location assignment: ${locationResult.error.message}` }
    }

    if (locationId !== assignment.location_id) {
      const permissionResult = await supabaseAdmin
        .from("employee_permissions")
        .update({ location_id: locationId })
        .eq("business_id", business.id)
        .eq("user_id", assignment.user_id)
        .eq("location_id", assignment.location_id)
      if (permissionResult.error) {
        return { ok: false, message: `Could not move employee permissions: ${permissionResult.error.message}` }
      }
    }

    revalidatePath(`/businesses/${business.slug}/admin/employees`)
    return { ok: true, message: "Employee details saved." }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not update employee." }
  }
}
