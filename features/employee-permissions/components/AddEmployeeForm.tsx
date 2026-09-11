"use client"

import { ThemedSelect } from "@/components/themed/ThemedSelect"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, UserPlus, X } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedMultiSelect } from "@/components/themed/ThemedMultiSelect"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import { useThemedToast } from "@/components/themed/ThemedToastProvider"
import { createEmployee } from "@/features/employee-permissions/actions/create-employee"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type {
  EmployeeLocationOption,
  EmployeePermissionField,
  EmployeeRole,
} from "@/features/employee-permissions/types/employee-permission"

const initialState = { ok: false, message: "" }
const permissionOptions: Array<[EmployeePermissionField, string]> = [
  ["can_view_orders", "View orders"],
  ["can_update_order_status", "Update order status"],
  ["can_view_customer_contact", "View customer contact"],
  ["can_manage_product_availability", "Product availability"],
  ["can_manage_modifier_availability", "Modifier availability"],
  ["can_manage_location_ordering", "Location ordering"],
  ["can_edit_products", "Edit products"],
  ["can_edit_modifiers", "Edit modifiers"],
]

function defaultsForRole(role: EmployeeRole) {
  const manager = role === "manager"
  return {
    can_view_orders: true,
    can_update_order_status: true,
    can_view_customer_contact: true,
    can_manage_product_availability: manager,
    can_manage_modifier_availability: manager,
    can_manage_location_ordering: false,
    can_edit_products: false,
    can_edit_modifiers: false,
  }
}

export function AddEmployeeForm({
  businessSlug,
  locations,
}: {
  businessSlug: string
  locations: EmployeeLocationOption[]
}) {
  const router = useRouter()
  const { showToast } = useThemedToast()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createEmployee, initialState)
  const [role, setRole] = useState<EmployeeRole>("staff")
  const [locationIds, setLocationIds] = useState<string[]>([])
  const [permissions, setPermissions] = useState(defaultsForRole("staff"))

  useEffect(() => {
    if (!state.ok) return
    showToast({ title: state.message, kind: "success" })
    router.refresh()
    const closeTimer = window.setTimeout(() => setOpen(false), 0)
    return () => window.clearTimeout(closeTimer)
  }, [router, showToast, state])

  function changeRole(nextRole: EmployeeRole) {
    setRole(nextRole)
    setPermissions(defaultsForRole(nextRole))
  }

  return (
    <>
      <div className="flex justify-end">
        <ThemedButton
          type="button"
          onClick={() => setOpen(true)}
          className="gap-1.5"
        >
          <UserPlus aria-hidden="true" className="size-4" />
          Add Employee
        </ThemedButton>
      </div>

      <ThemedSheet open={open} onOpenChange={setOpen}>
        <ThemedSheetContent
          side="bottom"
          showCloseButton={false}
          className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        >
          <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
            <ThemedSheetTitle>Add Employee</ThemedSheetTitle>
            <ThemedSheetDescription>
              Enter employee information, assign a location and role, then
              send an invitation.
            </ThemedSheetDescription>
          </ThemedSheetHeader>

          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <input type="hidden" name="businessSlug" value={businessSlug} />

            <div className={PRODUCT_ADMIN_PANEL_BODY_CLASS}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">First name</span>
                  <input
                    name="firstName"
                    required
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Last name</span>
                  <input
                    name="lastName"
                    required
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Phone</span>
                  <input
                    name="phone"
                    type="tel"
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  />
                </label>
                <div className="grid gap-1.5 text-sm">
                  <span className="font-medium">Location</span>
                  <ThemedMultiSelect
                    name="locationIds"
                    options={locations.map((location) => ({ value: location.id, label: location.name }))}
                    values={locationIds}
                    onChange={setLocationIds}
                    placeholder="Select locations"
                  />
                </div>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Role</span>
                  <ThemedSelect
                    name="role"
                    value={role}
                    onChange={(event) =>
                      changeRole(event.target.value as EmployeeRole)
                    }
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  >
                    <option value="staff">Staff Employee</option>
                    <option value="manager">Manager</option>
                  </ThemedSelect>
                </label>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Initial permissions</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {permissionOptions.map(([field, label]) => (
                    <label
                      key={field}
                      className="flex items-center gap-2 rounded-md border p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        name={field}
                        value="true"
                        checked={permissions[field]}
                        onChange={(event) =>
                          setPermissions({
                            ...permissions,
                            [field]: event.target.checked,
                          })
                        }
                        className="size-4"
                      />
                      <span className="font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {state.message && !state.ok ? (
                <p role="alert" className="text-sm text-destructive">
                  {state.message}
                </p>
              ) : null}
            </div>

            <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
              <ThemedButton
                type="button"
                variant="outline"
                size="icon"
                aria-label="Cancel adding employee"
                className="size-10 bg-background text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden="true" />
              </ThemedButton>
              <ThemedButton
                type="submit"
                size="icon"
                disabled={pending || locationIds.length === 0}
                aria-label="Add and invite employee"
                className="size-10"
              >
                <Check aria-hidden="true" className="size-4" />
                <span className="sr-only">
                  {pending ? "Adding employee" : "Add and invite employee"}
                </span>
              </ThemedButton>
            </div>
          </form>
        </ThemedSheetContent>
      </ThemedSheet>
    </>
  )
}
