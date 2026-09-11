"use client"

import { ThemedSelect } from "@/components/themed/ThemedSelect"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedMultiSelect } from "@/components/themed/ThemedMultiSelect"
import { AddEmployeeForm } from "@/features/employee-permissions/components/AddEmployeeForm"
import { saveEmployeePermissions } from "@/features/employee-permissions/actions/save-employee-permissions"
import type {
  EmployeeLocationOption,
  EmployeePermissionAssignment,
  EmployeePermissionField,
  EmployeeRole,
} from "@/features/employee-permissions/types/employee-permission"

const initialState = { ok: false, message: "" }
const permissionOptions: Array<{ field: EmployeePermissionField; label: string; description: string }> = [
  { field: "can_view_orders", label: "View orders", description: "See orders for assigned locations." },
  { field: "can_update_order_status", label: "Update order status", description: "Move orders through preparation or cancel them." },
  { field: "can_view_customer_contact", label: "View customer contact", description: "See customer names and phone numbers." },
  { field: "can_manage_product_availability", label: "Product availability", description: "Mark products sold out at assigned locations." },
  { field: "can_manage_modifier_availability", label: "Modifier availability", description: "Mark toppings and other choices sold out." },
  { field: "can_manage_location_ordering", label: "Location ordering", description: "Pause or resume ordering and fulfillment methods." },
  { field: "can_edit_products", label: "Edit products", description: "Change product details in the business catalog." },
  { field: "can_edit_modifiers", label: "Edit modifiers", description: "Change modifier groups, lists, and options." },
]

function EmployeeEditor({
  businessSlug,
  employee,
  locations,
}: {
  businessSlug: string
  employee: EmployeePermissionAssignment
  locations: EmployeeLocationOption[]
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveEmployeePermissions, initialState)
  const [role, setRole] = useState<EmployeeRole>(employee.role)
  const [isEnabled, setIsEnabled] = useState(employee.isEnabled)
  const [locationIds, setLocationIds] = useState(employee.locationIds)
  const [permissions, setPermissions] = useState(employee.permissions)

  useEffect(() => {
    if (state.ok) router.refresh()
  }, [router, state.ok])

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessSlug" value={businessSlug} />
      <input type="hidden" name="userId" value={employee.userId} />

      <ThemedCard className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Employee Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Contact and account information for this employee.</p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="isEnabled" value="true" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} className="size-4" />
            Active
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm"><span className="font-medium">First name</span><input name="firstName" required defaultValue={employee.firstName} className="h-10 rounded-md border bg-background px-3" /></label>
          <label className="grid gap-2 text-sm"><span className="font-medium">Last name</span><input name="lastName" required defaultValue={employee.lastName} className="h-10 rounded-md border bg-background px-3" /></label>
          <label className="grid gap-2 text-sm"><span className="font-medium">Email</span><input name="email" type="email" required defaultValue={employee.email} className="h-10 rounded-md border bg-background px-3" /></label>
          <label className="grid gap-2 text-sm"><span className="font-medium">Phone</span><input name="phone" type="tel" defaultValue={employee.phone} className="h-10 rounded-md border bg-background px-3" /></label>
        </div>
      </ThemedCard>

      <ThemedCard className="space-y-4 p-4">
        <div>
          <h2 className="text-base font-semibold">Assignment</h2>
          <p className="mt-1 text-sm text-muted-foreground">The role and permissions apply at every selected location.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Role</span>
            <ThemedSelect name="role" value={role} onChange={(event) => setRole(event.target.value as EmployeeRole)} className="h-10 rounded-md border bg-background px-3">
              <option value="manager">Manager</option>
              <option value="staff">Staff Employee</option>
            </ThemedSelect>
          </label>
          <div className="grid gap-2 text-sm">
            <span className="font-medium">Locations</span>
            <ThemedMultiSelect
              name="locationIds"
              options={locations.map((location) => ({ value: location.id, label: location.name }))}
              values={locationIds}
              onChange={setLocationIds}
              placeholder="Select locations"
            />
          </div>
        </div>
      </ThemedCard>

      <ThemedCard className="space-y-3 p-4">
        <div>
          <h2 className="text-base font-semibold">Permissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">These permissions apply at every assigned location.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {permissionOptions.map((permission) => (
            <label key={permission.field} className="flex items-start gap-3 rounded-md border p-3">
              <input type="checkbox" name={permission.field} value="true" checked={permissions[permission.field]} onChange={(event) => setPermissions({ ...permissions, [permission.field]: event.target.checked })} disabled={!isEnabled} className="mt-1 size-4" />
              <span><span className="block text-sm font-medium">{permission.label}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{permission.description}</span></span>
            </label>
          ))}
        </div>
      </ThemedCard>

      {state.message ? <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-destructive"}>{state.message}</p> : null}
      <div className="flex justify-end border-t pt-3">
        <ThemedButton type="submit" disabled={pending || locationIds.length === 0} className="gap-1.5">
          <Check aria-hidden="true" className="size-4" />
          {pending ? "Saving..." : "Save Employee"}
        </ThemedButton>
      </div>
    </form>
  )
}

export function EmployeePermissionsForm({ businessSlug, assignments, locations }: { businessSlug: string; assignments: EmployeePermissionAssignment[]; locations: EmployeeLocationOption[] }) {
  const [selectedUserId, setSelectedUserId] = useState(assignments[0]?.userId ?? "")
  const selected = assignments.find((employee) => employee.userId === selectedUserId) ?? null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid min-w-0 flex-1 gap-2 text-sm sm:max-w-md">
          <span className="font-medium">Employee</span>
          <ThemedSelect value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="h-10 rounded-md border bg-background px-3" disabled={assignments.length === 0}>
            {assignments.length === 0 ? <option value="">No employees</option> : null}
            {assignments.map((employee) => <option key={employee.userId} value={employee.userId}>{employee.employeeName}</option>)}
          </ThemedSelect>
        </label>
        <AddEmployeeForm businessSlug={businessSlug} locations={locations} />
      </div>

      {selected ? (
        <EmployeeEditor key={selected.userId} businessSlug={businessSlug} employee={selected} locations={locations} />
      ) : (
        <ThemedCard className="p-5 text-center">
          <p className="font-semibold">No employees</p>
          <p className="mt-1 text-sm text-muted-foreground">Add an employee to assign their role, locations, and permissions.</p>
        </ThemedCard>
      )}
    </div>
  )
}
