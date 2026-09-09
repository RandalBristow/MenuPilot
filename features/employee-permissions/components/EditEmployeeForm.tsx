"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Pencil, X } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import { useThemedToast } from "@/components/themed/ThemedToastProvider"
import { updateEmployeeDetails } from "@/features/employee-permissions/actions/update-employee-details"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type {
  EmployeeLocationOption,
  EmployeePermissionAssignment,
} from "@/features/employee-permissions/types/employee-permission"

const initialState = { ok: false, message: "" }

export function EditEmployeeForm({
  businessSlug,
  employee,
  locations,
}: {
  businessSlug: string
  employee: EmployeePermissionAssignment
  locations: EmployeeLocationOption[]
}) {
  const router = useRouter()
  const { showToast } = useThemedToast()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    updateEmployeeDetails,
    initialState
  )

  useEffect(() => {
    if (!state.ok) return
    showToast({ title: state.message, kind: "success" })
    router.refresh()
    const closeTimer = window.setTimeout(() => setOpen(false), 0)
    return () => window.clearTimeout(closeTimer)
  }, [router, showToast, state])

  return (
    <>
      <ThemedButton
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Edit ${employee.employeeName}`}
        title="View or edit employee details"
        className="size-10 shrink-0"
        onClick={() => setOpen(true)}
      >
        <Pencil aria-hidden="true" className="size-4" />
      </ThemedButton>

      <ThemedSheet open={open} onOpenChange={setOpen}>
        <ThemedSheetContent
          side="bottom"
          showCloseButton={false}
          className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        >
          <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
            <ThemedSheetTitle>Employee Details</ThemedSheetTitle>
            <ThemedSheetDescription>
              View or update this employee&apos;s contact information, location,
              and availability.
            </ThemedSheetDescription>
          </ThemedSheetHeader>

          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <input type="hidden" name="businessSlug" value={businessSlug} />
            <input
              type="hidden"
              name="assignmentId"
              value={employee.assignmentId}
            />

            <div className={PRODUCT_ADMIN_PANEL_BODY_CLASS}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">First name</span>
                  <input
                    name="firstName"
                    required
                    defaultValue={employee.firstName}
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Last name</span>
                  <input
                    name="lastName"
                    required
                    defaultValue={employee.lastName}
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={employee.email}
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Phone</span>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={employee.phone}
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm sm:col-span-2">
                  <span className="font-medium">Location</span>
                  <select
                    name="locationId"
                    required
                    defaultValue={employee.locationId}
                    className="h-10 w-full min-w-0 rounded-md border bg-background px-3"
                  >
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
                <input
                  type="checkbox"
                  name="isEnabled"
                  value="true"
                  defaultChecked={employee.isEnabled}
                  className="mt-1 size-4"
                />
                <span>
                  <span className="block font-medium">Active employee</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    Active employees can use their assigned role and permissions
                    at this location.
                  </span>
                </span>
              </label>

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
                aria-label="Cancel editing employee"
                className="size-10 bg-background text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden="true" />
              </ThemedButton>
              <ThemedButton
                type="submit"
                size="icon"
                disabled={pending || locations.length === 0}
                aria-label="Save employee details"
                className="size-10"
              >
                <Check aria-hidden="true" className="size-4" />
                <span className="sr-only">
                  {pending ? "Saving employee details" : "Save employee details"}
                </span>
              </ThemedButton>
            </div>
          </form>
        </ThemedSheetContent>
      </ThemedSheet>
    </>
  )
}
