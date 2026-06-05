"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Wand2 } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"
import {
  createPlatformBusinessWithLocation,
  type CreatePlatformBusinessActionState,
} from "@/features/platform-admin/actions/create-platform-business"
import { normalizePlatformSlug } from "@/features/platform-admin/utils/create-platform-business"

const initialCreatePlatformBusinessActionState: CreatePlatformBusinessActionState =
  {
    ok: false,
    error: "",
  }

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <span className="text-sm font-medium">
      {children}
      {required ? <span className="text-destructive"> *</span> : null}
    </span>
  )
}

function TextInput({
  label,
  name,
  value,
  onChange,
  required = false,
  type = "text",
  autoComplete,
  defaultValue,
}: {
  label: string
  name: string
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  type?: string
  autoComplete?: string
  defaultValue?: string
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        autoComplete={autoComplete}
        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
      />
    </label>
  )
}

function SlugInput({
  label,
  name,
  value,
  onChange,
  onGenerate,
}: {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
}) {
  return (
    <div className="grid gap-2">
      <FieldLabel required>{label}</FieldLabel>
      <div className="flex gap-2">
        <input
          name={name}
          required
          value={value}
          onChange={(event) => onChange(normalizePlatformSlug(event.target.value))}
          className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
        />
        <ThemedButton
          type="button"
          variant="outline"
          aria-label={`Generate ${label.toLowerCase()} from name`}
          className="h-10 bg-background text-foreground hover:bg-muted"
          onClick={onGenerate}
        >
          <Wand2 aria-hidden="true" />
        </ThemedButton>
      </div>
    </div>
  )
}

export function PlatformBusinessCreateForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    createPlatformBusinessWithLocation,
    initialCreatePlatformBusinessActionState
  )
  const [businessName, setBusinessName] = useState("")
  const [businessSlug, setBusinessSlug] = useState("")
  const [locationName, setLocationName] = useState("")
  const [locationSlug, setLocationSlug] = useState("")

  useEffect(() => {
    if (state.ok) {
      router.push(`/platform/businesses/${state.businessId}`)
    }
  }, [router, state])

  return (
    <ThemedPageShell maxWidth="xl">
      <Link
        href="/platform/businesses"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Businesses
      </Link>

      <ThemedPageHeader
        title="New Business"
        description="Create a setup-mode business and its first disabled location."
      />

      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        Auth/role protection is deferred; do not expose Platform Admin publicly.
      </div>

      <form action={formAction} className="space-y-3">
        {state.ok === false && state.error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        ) : null}

        <ThemedCard className="p-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Business</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                New businesses start in setup mode.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Business name"
                name="businessName"
                required
                value={businessName}
                onChange={setBusinessName}
                autoComplete="organization"
              />
              <SlugInput
                label="Business slug"
                name="businessSlug"
                value={businessSlug}
                onChange={setBusinessSlug}
                onGenerate={() =>
                  setBusinessSlug(normalizePlatformSlug(businessName))
                }
              />
              <TextInput label="Legal name" name="legalName" />
              <TextInput
                label="Primary contact name"
                name="primaryContactName"
                autoComplete="name"
              />
              <TextInput
                label="Primary contact email"
                name="primaryContactEmail"
                type="email"
                autoComplete="email"
              />
              <TextInput
                label="Primary phone"
                name="primaryPhone"
                type="tel"
                autoComplete="tel"
              />
            </div>

            <label className="grid gap-2">
              <FieldLabel>Description</FieldLabel>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
        </ThemedCard>

        <ThemedCard className="p-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">First Location</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The first location starts disabled and not accepting orders.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Location name"
                name="locationName"
                required
                value={locationName}
                onChange={setLocationName}
              />
              <SlugInput
                label="Location slug"
                name="locationSlug"
                value={locationSlug}
                onChange={setLocationSlug}
                onGenerate={() =>
                  setLocationSlug(normalizePlatformSlug(locationName))
                }
              />
              <TextInput
                label="Address line 1"
                name="addressLine1"
                autoComplete="address-line1"
              />
              <TextInput
                label="Address line 2"
                name="addressLine2"
                autoComplete="address-line2"
              />
              <TextInput label="City" name="city" autoComplete="address-level2" />
              <TextInput
                label="State"
                name="state"
                autoComplete="address-level1"
              />
              <TextInput
                label="Postal code"
                name="postalCode"
                autoComplete="postal-code"
              />
              <TextInput
                label="Phone"
                name="locationPhone"
                type="tel"
                autoComplete="tel"
              />
              <TextInput
                label="Email"
                name="locationEmail"
                type="email"
                autoComplete="email"
              />
              <TextInput
                label="Timezone"
                name="timezone"
                required
                defaultValue="America/New_York"
              />
            </div>
          </div>
        </ThemedCard>

        <div className="flex justify-end border-t pt-3">
          <ThemedButton type="submit" disabled={isPending} className="gap-1.5">
            <Check aria-hidden="true" className="size-4" />
            {isPending ? "Creating..." : "Create Business"}
          </ThemedButton>
        </div>
      </form>
    </ThemedPageShell>
  )
}
