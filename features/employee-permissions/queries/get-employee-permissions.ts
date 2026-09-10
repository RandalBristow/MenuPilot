import { supabaseAdmin } from "@/lib/supabase/admin"
import type {
  EmployeePermissionAssignment,
  EmployeeRole,
} from "@/features/employee-permissions/types/employee-permission"

type RawEmployee = {
  user_id: string
  role: EmployeeRole
  is_enabled: boolean
  profiles: { first_name: string | null; last_name: string | null; display_name: string | null; phone: string | null } | null
}

type RawAssignment = {
  user_id: string
  location_id: string
}

type RawPermission = EmployeePermissionAssignment["permissions"] & {
  user_id: string
  location_id: string
}

function getEmployeeName(profile: RawEmployee["profiles"]) {
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
  const [employeesResult, assignmentsResult, permissionsResult, locationsResult, authUsersResult] = await Promise.all([
    supabaseAdmin
      .from("business_users")
      .select("user_id, role, is_enabled, profiles(first_name, last_name, display_name, phone)")
      .eq("business_id", businessId)
      .in("role", ["manager", "staff"]),
    supabaseAdmin
      .from("location_users")
      .select("user_id, location_id")
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

  if (employeesResult.error) throw new Error(`Could not load employees: ${employeesResult.error.message}`)
  if (assignmentsResult.error) throw new Error(`Could not load employee locations: ${assignmentsResult.error.message}`)
  if (permissionsResult.error) throw new Error(`Could not load employee permissions: ${permissionsResult.error.message}`)
  if (locationsResult.error) throw new Error(`Could not load employee locations: ${locationsResult.error.message}`)
  if (authUsersResult.error) throw new Error(`Could not load employee emails: ${authUsersResult.error.message}`)

  const employees = (employeesResult.data ?? []) as unknown as RawEmployee[]
  const assignments = (assignmentsResult.data ?? []) as RawAssignment[]
  const permissions = (permissionsResult.data ?? []) as RawPermission[]
  const authUsers = new Map(
    authUsersResult.data.users.map((user) => [user.id, user.email ?? ""])
  )

  const mappedAssignments = employees
    .map((employee): EmployeePermissionAssignment => {
      const locationIds = assignments
        .filter((assignment) => assignment.user_id === employee.user_id)
        .map((assignment) => assignment.location_id)
      const saved = permissions.find(
        (permission) => permission.user_id === employee.user_id
      )
      return {
        userId: employee.user_id,
        employeeName: getEmployeeName(employee.profiles),
        firstName: employee.profiles?.first_name ?? "",
        lastName: employee.profiles?.last_name ?? "",
        email: authUsers.get(employee.user_id) ?? "",
        phone: employee.profiles?.phone ?? "",
        locationIds,
        role: employee.role,
        isEnabled: employee.is_enabled,
        permissions: saved ?? getDefaults(employee.role),
      }
    })
    .sort((first, second) => first.employeeName.localeCompare(second.employeeName))

  return {
    assignments: mappedAssignments,
    locations: (locationsResult.data ?? []).map((location) => ({
      id: location.id,
      name: location.name,
    })),
  }
}
