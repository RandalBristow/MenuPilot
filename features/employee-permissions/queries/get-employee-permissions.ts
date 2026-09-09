import { supabaseAdmin } from "@/lib/supabase/admin"
import type {
  EmployeePermissionAssignment,
  EmployeeRole,
} from "@/features/employee-permissions/types/employee-permission"

type RawAssignment = {
  id: string
  user_id: string
  location_id: string
  role: EmployeeRole
  is_enabled: boolean
  profiles: { first_name: string | null; last_name: string | null; display_name: string | null; phone: string | null } | null
  locations: { name: string } | null
}

type RawPermission = EmployeePermissionAssignment["permissions"] & {
  user_id: string
  location_id: string
}

function getEmployeeName(profile: RawAssignment["profiles"]) {
  if (!profile) return "Unnamed employee"
  if (profile.display_name?.trim()) return profile.display_name.trim()
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
  return fullName || "Unnamed employee"
}

function getDefaults(role: EmployeeRole) {
  const isManager = role === "manager"
  return {
    can_view_orders: true,
    can_update_order_status: true,
    can_view_customer_contact: true,
    can_manage_product_availability: isManager,
    can_manage_modifier_availability: isManager,
    can_manage_location_ordering: false,
    can_edit_products: false,
    can_edit_modifiers: false,
  }
}

export async function getEmployeePermissions(businessId: string) {
  const [assignmentsResult, permissionsResult, locationsResult, authUsersResult] = await Promise.all([
    supabaseAdmin
      .from("location_users")
      .select("id, user_id, location_id, role, is_enabled, profiles(first_name, last_name, display_name, phone), locations(name)")
      .eq("business_id", businessId)
      .in("role", ["manager", "staff"]),
    supabaseAdmin
      .from("employee_permissions")
      .select("user_id, location_id, can_view_orders, can_update_order_status, can_view_customer_contact, can_manage_product_availability, can_manage_modifier_availability, can_manage_location_ordering, can_edit_products, can_edit_modifiers")
      .eq("business_id", businessId),
    supabaseAdmin
      .from("locations")
      .select("id, name, sort_order")
      .eq("business_id", businessId)
      .order("sort_order")
      .order("name"),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  if (assignmentsResult.error) throw new Error(`Could not load employees: ${assignmentsResult.error.message}`)
  if (permissionsResult.error) throw new Error(`Could not load employee permissions: ${permissionsResult.error.message}`)
  if (locationsResult.error) throw new Error(`Could not load employee locations: ${locationsResult.error.message}`)
  if (authUsersResult.error) throw new Error(`Could not load employee emails: ${authUsersResult.error.message}`)

  const assignments = (assignmentsResult.data ?? []) as unknown as RawAssignment[]
  const permissions = (permissionsResult.data ?? []) as RawPermission[]
  const authUsers = new Map(
    authUsersResult.data.users.map((user) => [user.id, user.email ?? ""])
  )

  const mappedAssignments = assignments
    .map((assignment): EmployeePermissionAssignment => {
      const saved = permissions.find(
        (permission) => permission.user_id === assignment.user_id && permission.location_id === assignment.location_id
      )
      return {
        assignmentId: assignment.id,
        userId: assignment.user_id,
        employeeName: getEmployeeName(assignment.profiles),
        firstName: assignment.profiles?.first_name ?? "",
        lastName: assignment.profiles?.last_name ?? "",
        email: authUsers.get(assignment.user_id) ?? "",
        phone: assignment.profiles?.phone ?? "",
        locationId: assignment.location_id,
        locationName: assignment.locations?.name ?? "Unknown location",
        role: assignment.role,
        isEnabled: assignment.is_enabled,
        permissions: saved ?? getDefaults(assignment.role),
      }
    })
    .sort((first, second) =>
      `${first.locationName}-${first.employeeName}`.localeCompare(`${second.locationName}-${second.employeeName}`)
    )

  return {
    assignments: mappedAssignments,
    locations: (locationsResult.data ?? []).map((location) => ({
      id: location.id,
      name: location.name,
    })),
  }
}
