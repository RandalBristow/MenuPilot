"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  updatePlatformBusinessStatus,
  updatePlatformLocationSettings,
  type PlatformActivationActionState,
} from "@/features/platform-admin/actions/update-platform-activation"
import type {
  PlatformBusinessDetail,
  PlatformBusinessLocation,
} from "@/features/platform-admin/types/platform-admin"

const initialState: PlatformActivationActionState = {
  ok: false,
  error: "",
}

const statusOptions = ["setup", "active", "paused", "archived"] as const

function ResultMessage({ state }: { state: PlatformActivationActionState }) {
  if (state.ok) {
    return (
      <p className="text-xs font-medium text-success" role="status">
        {state.message}
      </p>
    )
  }

  if (state.error) {
    return (
      <p className="text-xs font-medium text-destructive" role="alert">
        {state.error}
      </p>
    )
  }

  return null
}

function StatusSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <select
      id={id}
      name="status"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-md border bg-background px-2 text-sm capitalize"
    >
      {statusOptions.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  )
}

function CheckboxField({
  name,
  label,
  checked,
}: {
  name: string
  label: string
  checked: boolean
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="size-4 rounded border"
      />
      <span>{label}</span>
    </label>
  )
}

export function BusinessStatusControl({
  business,
}: {
  business: PlatformBusinessDetail
}) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState(business.status)
  const [state, formAction, isPending] = useActionState(
    updatePlatformBusinessStatus,
    initialState
  )

  useEffect(() => {
    if (state.ok) {
      router.refresh()
    }
  }, [router, state])

  return (
    <form action={formAction} className="space-y-2 rounded-lg border p-3">
      <input type="hidden" name="businessId" value={business.id} />
      <input type="hidden" name="businessSlug" value={business.slug} />
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Business status</span>
        <StatusSelect
          id={`business-status-${business.id}`}
          value={selectedStatus}
          onChange={setSelectedStatus}
        />
      </label>

      <p className="text-xs leading-5 text-muted-foreground">
        Setup businesses can be managed and previewed. Active businesses may be
        publicly visible and orderable when location settings allow it.
      </p>

      <div className="flex items-center justify-between gap-2">
        <ResultMessage state={state} />
        <ThemedButton type="submit" disabled={isPending} className="h-9 gap-1.5">
          <Check aria-hidden="true" className="size-4" />
          {isPending ? "Saving..." : "Save"}
        </ThemedButton>
      </div>
    </form>
  )
}

export function LocationActivationControl({
  business,
  location,
}: {
  business: PlatformBusinessDetail
  location: PlatformBusinessLocation
}) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState(location.status)
  const [state, formAction, isPending] = useActionState(
    updatePlatformLocationSettings,
    initialState
  )

  useEffect(() => {
    if (state.ok) {
      router.refresh()
    }
  }, [router, state])

  return (
    <form action={formAction} className="space-y-3 rounded-lg border p-3">
      <input type="hidden" name="businessId" value={business.id} />
      <input type="hidden" name="businessSlug" value={business.slug} />
      <input type="hidden" name="locationId" value={location.id} />
      <input type="hidden" name="locationSlug" value={location.slug} />

      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Location status</span>
        <StatusSelect
          id={`location-status-${location.id}`}
          value={selectedStatus}
          onChange={setSelectedStatus}
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <CheckboxField
          name="isEnabled"
          label="Enabled"
          checked={location.isEnabled}
        />
        <CheckboxField
          name="acceptingOrders"
          label="Accepting orders"
          checked={location.acceptingOrders}
        />
        <CheckboxField
          name="pickupEnabled"
          label="Pickup enabled"
          checked={location.pickupEnabled}
        />
        <CheckboxField
          name="deliveryEnabled"
          label="Delivery enabled"
          checked={location.deliveryEnabled}
        />
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Checkout requires an active business, active location, enabled location,
        accepting orders, and pickup or delivery enabled. If accepting orders is
        checked while those requirements are not met, it will be saved as off.
      </p>

      <div className="flex items-center justify-between gap-2">
        <ResultMessage state={state} />
        <ThemedButton type="submit" disabled={isPending} className="h-9 gap-1.5">
          <Check aria-hidden="true" className="size-4" />
          {isPending ? "Saving..." : "Save"}
        </ThemedButton>
      </div>
    </form>
  )
}
