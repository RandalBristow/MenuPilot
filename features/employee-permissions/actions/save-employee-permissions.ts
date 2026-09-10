"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { employeePermissionFields, type EmployeeRole } from "@/features/employee-permissions/types/employee-permission"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"

export type SaveEmployeePermissionsState = { ok: boolean; message: string }

function required(formData: FormData, name: string, label: string) {
  const value = String(formData.get(name) ?? "").trim()
  if (!value) throw new Error(`${label} is required.`)
  return value
}

export async function saveEmployeePermissions(
  _previousState: SaveEmployeePermissionsState,
  formData: FormData
): Promise<SaveEmployeePermissionsState> {
  try {
    const businessSlug = required(formData, "businessSlug", "Business")
    const userId = required(formData, "userId", "Employee")
    const firstName = required(formData, "firstName", "First name")
    const lastName = required(formData, "lastName", "Last name")
    const email = required(formData, "email", "Email").toLowerCase()
    const phone = String(formData.get("phone") ?? "").trim() || null
    const locationIds = [...new Set(formData.getAll("locationIds").map(String))]
    const role = String(formData.get("role") ?? "") as EmployeeRole
    const isEnabled = formData.get("isEnabled") === "true"

    if (role !== "manager" && role !== "staff") return { ok: false, message: "Choose a valid employee role." }
    if (locationIds.length === 0) return { ok: false, message: "Choose at least one location." }

    const business = await resolveBusinessContext({ businessSlug })
    if (!business) return { ok: false, message: "Business could not be found." }

    const [{ data: employee }, { data: validLocations, error: locationError }] = await Promise.all([
      supabaseAdmin.from("business_users").select("user_id").eq("business_id", business.id).eq("user_id", userId).in("role", ["manager", "staff"]).single(),
      supabaseAdmin.from("locations").select("id").eq("business_id", business.id).in("id", locationIds),
    ])
    if (!employee) return { ok: false, message: "Employee is invalid." }
    if (locationError || (validLocations?.length ?? 0) !== locationIds.length) return { ok: false, message: "One or more selected locations are invalid." }

    const authResult = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      user_metadata: { first_name: firstName, last_name: lastName, display_name: `${firstName} ${lastName}` },
    })
    if (authResult.error) return { ok: false, message: `Could not update employee login: ${authResult.error.message}` }

    const profileResult = await supabaseAdmin.from("profiles").update({
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`,
      phone,
    }).eq("id", userId)
    if (profileResult.error) return { ok: false, message: `Could not update employee profile: ${profileResult.error.message}` }

    const businessUserResult = await supabaseAdmin.from("business_users").update({ role, is_enabled: isEnabled }).eq("business_id", business.id).eq("user_id", userId)
    if (businessUserResult.error) return { ok: false, message: `Could not update employee role: ${businessUserResult.error.message}` }

    const removedPermissions = await supabaseAdmin.from("employee_permissions").delete().eq("business_id", business.id).eq("user_id", userId).not("location_id", "in", `(${locationIds.join(",")})`)
    if (removedPermissions.error) return { ok: false, message: `Could not remove old permissions: ${removedPermissions.error.message}` }

    const removedAssignments = await supabaseAdmin.from("location_users").delete().eq("business_id", business.id).eq("user_id", userId).not("location_id", "in", `(${locationIds.join(",")})`)
    if (removedAssignments.error) return { ok: false, message: `Could not remove old locations: ${removedAssignments.error.message}` }

    const assignmentResult = await supabaseAdmin.from("location_users").upsert(
      locationIds.map((locationId) => ({ business_id: business.id, location_id: locationId, user_id: userId, role, is_enabled: isEnabled })),
      { onConflict: "location_id,user_id" }
    )
    if (assignmentResult.error) return { ok: false, message: `Could not save employee locations: ${assignmentResult.error.message}` }

    const permissions = Object.fromEntries(employeePermissionFields.map((field) => [field, formData.get(field) === "true"]))
    const permissionResult = await supabaseAdmin.from("employee_permissions").upsert(
      locationIds.map((locationId) => ({ business_id: business.id, location_id: locationId, user_id: userId, ...permissions })),
      { onConflict: "location_id,user_id" }
    )
    if (permissionResult.error) return { ok: false, message: `Could not save permissions: ${permissionResult.error.message}` }

    revalidatePath(`/businesses/${business.slug}/admin/employees`)
    return { ok: true, message: "Employee details, locations, role, and permissions saved." }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save employee." }
  }
}
