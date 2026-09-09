export const employeePermissionFields = [
  "can_view_orders",
  "can_update_order_status",
  "can_view_customer_contact",
  "can_manage_product_availability",
  "can_manage_modifier_availability",
  "can_manage_location_ordering",
  "can_edit_products",
  "can_edit_modifiers",
] as const

export type EmployeePermissionField = (typeof employeePermissionFields)[number]
export type EmployeeRole = "manager" | "staff"

export type EmployeePermissionAssignment = {
  assignmentId: string
  userId: string
  employeeName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  locationId: string
  locationName: string
  role: EmployeeRole
  isEnabled: boolean
  permissions: Record<EmployeePermissionField, boolean>
}

export type EmployeeLocationOption = {
  id: string
  name: string
}
