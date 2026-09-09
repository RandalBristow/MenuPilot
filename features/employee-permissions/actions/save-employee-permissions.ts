"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  employeePermissionFields,
  type EmployeeRole,
} from "@/features/employee-permissions/types/employee-permission"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"

export type SaveEmployeePermissionsState = { ok: boolean; message: string }

export async function saveEmployeePermissions(
  _previousState: SaveEmployeePermissionsState,
  formData: FormData
): Promise<SaveEmployeePermissionsState> {
  const businessSlug = String(formData.get("businessSlug") ?? "").trim()
  const assignmentId = String(formData.get("assignmentId") ?? "").trim()
  const role = String(formData.get("role") ?? "") as EmployeeRole
  if (!assignmentId) return { ok: false, message: "Choose an employee." }
  if (role !== "manager" && role !== "staff") {
    return { ok: false, message: "Choose a valid employee role." }
  }

  const business = await resolveBusinessContext({ businessSlug })
  if (!business) return { ok: false, message: "Business could not be found." }
  const { data: assignment, error } = await supabaseAdmin
    .from("location_users")
    .select("id, user_id, location_id")
    .eq("id", assignmentId)
    .eq("business_id", business.id)
    .in("role", ["manager", "staff"])
    .single()
  if (error || !assignment) return { ok: false, message: "Employee assignment is invalid." }

  const roleResult = await supabaseAdmin
    .from("location_users")
    .update({ role })
    .eq("id", assignment.id)
    .eq("business_id", business.id)
  if (roleResult.error) return { ok: false, message: `Could not update role: ${roleResult.error.message}` }

  const permissionResult = await supabaseAdmin.from("employee_permissions").upsert(
    {
      business_id: business.id,
      location_id: assignment.location_id,
      user_id: assignment.user_id,
      ...Object.fromEntries(
        employeePermissionFields.map((field) => [field, formData.get(field) === "true"])
      ),
    },
    { onConflict: "location_id,user_id" }
  )
  if (permissionResult.error) {
    return { ok: false, message: `Could not save permissions: ${permissionResult.error.message}` }
  }

  revalidatePath(`/businesses/${business.slug}/admin/employees`)
  return { ok: true, message: "Employee role and permissions saved." }
}
