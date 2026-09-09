"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { saveEmployeePermissions } from "@/features/employee-permissions/actions/save-employee-permissions"
import { AddEmployeeForm } from "@/features/employee-permissions/components/AddEmployeeForm"
import { EditEmployeeForm } from "@/features/employee-permissions/components/EditEmployeeForm"
import type {
  EmployeePermissionAssignment,
  EmployeeLocationOption,
  EmployeePermissionField,
  EmployeeRole,
} from "@/features/employee-permissions/types/employee-permission"

const initialState = { ok: false, message: "" }
const permissionOptions: Array<{
  field: EmployeePermissionField
  label: string
  description: string
}> = [
  { field: "can_view_orders", label: "View orders", description: "See orders for the assigned location." },
  { field: "can_update_order_status", label: "Update order status", description: "Move orders through preparation or cancel them." },
  { field: "can_view_customer_contact", label: "View customer contact", description: "See customer names and phone numbers." },
  { field: "can_manage_product_availability", label: "Product availability", description: "Mark products sold out for this location." },
  { field: "can_manage_modifier_availability", label: "Modifier availability", description: "Mark toppings and other choices sold out." },
  { field: "can_manage_location_ordering", label: "Location ordering", description: "Pause or resume ordering and fulfillment methods." },
  { field: "can_edit_products", label: "Edit products", description: "Change product details in the business catalog." },
  { field: "can_edit_modifiers", label: "Edit modifiers", description: "Change modifier groups, lists, and options." },
]

export function EmployeePermissionsForm({ businessSlug, assignments, locations }: { businessSlug: string; assignments: EmployeePermissionAssignment[]; locations: EmployeeLocationOption[] }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveEmployeePermissions, initialState)
  const availableLocations = locations.filter((location) =>
    assignments.some((assignment) => assignment.locationId === location.id)
  )
  const [selectedLocationId, setSelectedLocationId] = useState(
    assignments[0]?.locationId ?? ""
  )
  const filteredAssignments = assignments.filter(
    (assignment) => assignment.locationId === selectedLocationId
  )
  const [selectedId, setSelectedId] = useState(assignments[0]?.assignmentId ?? "")
  const selected = assignments.find((assignment) => assignment.assignmentId === selectedId) ?? null
  const [role, setRole] = useState<EmployeeRole>(selected?.role ?? "staff")
  const [values, setValues] = useState(selected?.permissions ?? null)

  useEffect(() => {
    if (state.ok) router.refresh()
  }, [router, state.ok])

  function selectEmployee(assignmentId: string) {
    const assignment = assignments.find((item) => item.assignmentId === assignmentId)
    setSelectedId(assignmentId)
    setRole(assignment?.role ?? "staff")
    setValues(assignment?.permissions ?? null)
  }

  function selectLocation(locationId: string) {
    const firstAssignment = assignments.find(
      (assignment) => assignment.locationId === locationId
    )
    setSelectedLocationId(locationId)
    selectEmployee(firstAssignment?.assignmentId ?? "")
  }

  if (!selected || !values) {
    return <div className="space-y-4">
      <AddEmployeeForm businessSlug={businessSlug} locations={locations} />
      <ThemedCard className="p-5 text-center">
        <p className="font-semibold">No employees assigned</p>
        <p className="mt-1 text-sm text-muted-foreground">Employees appear here after they are assigned to a location.</p>
      </ThemedCard>
    </div>
  }

  return (
    <div className="space-y-4">
      <AddEmployeeForm businessSlug={businessSlug} locations={locations} />
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessSlug" value={businessSlug} />
      <input type="hidden" name="assignmentId" value={selected.assignmentId} />

      <ThemedCard className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Location</span>
            <select
              value={selectedLocationId}
              onChange={(event) => selectLocation(event.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            >
              {availableLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 text-sm">
            <span className="font-medium">Employee</span>
            <div className="flex gap-2">
              <select value={selectedId} onChange={(event) => selectEmployee(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3">
                {filteredAssignments.map((assignment) => (
                  <option key={assignment.assignmentId} value={assignment.assignmentId}>
                    {assignment.employeeName}
                  </option>
                ))}
              </select>
              <EditEmployeeForm
                key={selected.assignmentId}
                businessSlug={businessSlug}
                employee={selected}
                locations={locations}
              />
            </div>
          </div>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Role</span>
            <select name="role" value={role} onChange={(event) => setRole(event.target.value as EmployeeRole)} className="h-10 rounded-md border bg-background px-3">
              <option value="manager">Manager</option>
              <option value="staff">Staff Employee</option>
            </select>
          </label>
        </div>
      </ThemedCard>

      <ThemedCard className="p-4">
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Permissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Role and permissions are saved independently, so you can customize either role.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {permissionOptions.map((permission) => (
              <label key={permission.field} className="flex items-start gap-3 rounded-md border p-3">
                <input
                  type="checkbox"
                  name={permission.field}
                  value="true"
                  checked={values[permission.field]}
                  onChange={(event) => setValues({ ...values, [permission.field]: event.target.checked })}
                  disabled={!selected.isEnabled}
                  className="mt-1 size-4"
                />
                <span>
                  <span className="block text-sm font-medium">{permission.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{permission.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </ThemedCard>

      {state.message ? <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-destructive"}>{state.message}</p> : null}
      <div className="flex justify-end border-t pt-3">
        <ThemedButton type="submit" disabled={pending || !selected.isEnabled} className="gap-1.5">
          <Check aria-hidden="true" className="size-4" />
          {pending ? "Saving..." : "Save Employee"}
        </ThemedButton>
      </div>
    </form>
    </div>
  )
}
