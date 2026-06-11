import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronRight,
  ExternalLink,
  Plus,
} from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"
import type {
  PlatformBusinessDetail,
  PlatformBusinessListItem,
  PlatformBusinessLocation,
} from "@/features/platform-admin/types/platform-admin"
import {
  BusinessStatusControl,
  LocationActivationControl,
} from "@/features/platform-admin/components/PlatformActivationControls"
import { BusinessPricingSettingsForm } from "@/features/pricing-settings/components/BusinessPricingSettingsForm"
import type { BusinessPricingSettings } from "@/lib/pricing/business-pricing-settings"
import { cn } from "@/lib/utils"

function formatFallback(value: string | null | undefined) {
  return value?.trim() ? value : "Not set"
}

function formatAddress(location: PlatformBusinessLocation) {
  const parts = [
    location.addressLine1,
    location.addressLine2,
    [location.city, location.state, location.postalCode]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(" ") : "Address not set"
}

function getStatusClassName(status: string) {
  if (status === "active") {
    return "border-success/30 bg-success/10 text-success"
  }

  if (status === "setup") {
    return "border-accent/40 bg-accent/20 text-accent-foreground"
  }

  if (status === "paused" || status === "archived") {
    return "border-muted-foreground/25 bg-muted text-muted-foreground"
  }

  return "border-border bg-secondary text-secondary-foreground"
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        getStatusClassName(status)
      )}
    >
      {status}
    </span>
  )
}

function BooleanPill({
  enabled,
  label,
}: {
  enabled: boolean
  label: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        enabled
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted-foreground/25 bg-muted text-muted-foreground"
      )}
    >
      {label}: {enabled ? "Yes" : "No"}
    </span>
  )
}

function AuthWarning() {
  return (
    <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>
        Auth/role protection is deferred; do not expose Platform Admin publicly.
      </p>
    </div>
  )
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {label}
    </Link>
  )
}

export function PlatformAdminHubPage() {
  return (
    <ThemedPageShell maxWidth="lg">
      <ThemedPageHeader
        title="Platform Admin"
        description="Internal app-owner tools for business onboarding and setup review."
      />

      <AuthWarning />

      <div className="grid gap-3">
        <Link
          href="/platform/businesses"
          aria-label="Open businesses"
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ThemedCard className="gap-1 p-3 transition-colors hover:bg-muted/40">
            <div className="flex min-w-0 items-center gap-3">
              <Building2
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-base font-semibold">Businesses</h2>
                <p className="m-0 mt-1 text-sm text-muted-foreground">
                  View businesses, locations, setup status, and ordering state.
                </p>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
            </div>
          </ThemedCard>
        </Link>
      </div>
    </ThemedPageShell>
  )
}

export function PlatformBusinessesPage({
  businesses,
}: {
  businesses: PlatformBusinessListItem[]
}) {
  return (
    <ThemedPageShell maxWidth="xl">
      <BackLink href="/platform" label="Platform Admin" />

      <ThemedPageHeader
        title="Businesses"
        description="Review businesses and their first-location setup state."
        actions={
          <ThemedButton asChild className="gap-1.5">
            <Link href="/platform/businesses/new">
              <Plus aria-hidden="true" className="size-4" />
              New Business
            </Link>
          </ThemedButton>
        }
      />

      <AuthWarning />

      {businesses.length === 0 ? (
        <ThemedCard className="p-4">
          <h2 className="text-base font-semibold">No businesses yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Business creation is the next Platform Admin step.
          </p>
        </ThemedCard>
      ) : (
        <div className="grid gap-3">
          {businesses.map((business) => (
            <Link
              key={business.id}
              href={`/platform/businesses/${business.id}`}
              aria-label={`Open ${business.name}`}
              className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ThemedCard className="p-3 transition-colors hover:bg-muted/40">
                <div className="flex min-w-0 items-start gap-3">
                  <Building2
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        {business.name}
                      </h2>
                      <p className="truncate text-xs text-muted-foreground">
                        {business.slug}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <StatusPill status={business.status} />
                      <span className="inline-flex rounded-full border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {business.locationCount}{" "}
                        {business.locationCount === 1
                          ? "location"
                          : "locations"}
                      </span>
                    </div>

                    <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Contact: {formatFallback(business.primaryContactName)}</p>
                      <p>Email: {formatFallback(business.primaryContactEmail)}</p>
                      <p>Phone: {formatFallback(business.primaryPhone)}</p>
                      <p>
                        First location:{" "}
                        {business.firstLocation
                          ? `${business.firstLocation.name} (${business.firstLocation.status})`
                          : "None"}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-muted-foreground"
                  />
                </div>
              </ThemedCard>
            </Link>
          ))}
        </div>
      )}
    </ThemedPageShell>
  )
}

export function PlatformBusinessDetailPage({
  business,
  pricingSettings,
}: {
  business: PlatformBusinessDetail
  pricingSettings: BusinessPricingSettings
}) {
  const hasLocations = business.locations.length > 0
  const hasOrderingEnabled = business.locations.some(
    (location) => location.acceptingOrders
  )

  return (
    <ThemedPageShell maxWidth="xl">
      <BackLink href="/platform/businesses" label="Businesses" />

      <ThemedPageHeader
        title={business.name}
        description="Business setup state and location readiness."
        actions={
          business.slug ? (
            <ThemedButton asChild className="gap-1.5">
              <Link href={`/businesses/${business.slug}/admin`}>
                <ExternalLink aria-hidden="true" className="size-4" />
                Open Business Admin
              </Link>
            </ThemedButton>
          ) : null
        }
      />

      <AuthWarning />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-3">
          <ThemedCard className="p-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">Business Details</h2>
                <StatusPill status={business.status} />
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Slug</dt>
                  <dd className="font-medium">{business.slug}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Legal name</dt>
                  <dd>{formatFallback(business.legalName)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Primary contact</dt>
                  <dd>{formatFallback(business.primaryContactName)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Contact email</dt>
                  <dd>{formatFallback(business.primaryContactEmail)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Primary phone</dt>
                  <dd>{formatFallback(business.primaryPhone)}</dd>
                </div>
              </dl>

              {business.description ? (
                <p className="text-sm text-muted-foreground">
                  {business.description}
                </p>
              ) : null}

              <BusinessStatusControl
                key={`${business.id}-${business.status}`}
                business={business}
              />
            </div>
          </ThemedCard>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">Locations</h2>

            {!hasLocations ? (
              <ThemedCard className="p-4">
                <p className="text-sm text-muted-foreground">
                  No locations have been created for this business yet.
                </p>
              </ThemedCard>
            ) : (
              <div className="grid gap-3">
                {business.locations.map((location) => (
                  <ThemedCard key={location.id} className="p-3">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold">
                            {location.name}
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">
                            {location.slug}
                          </p>
                        </div>
                        <StatusPill status={location.status} />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <BooleanPill
                          enabled={location.isEnabled}
                          label="Enabled"
                        />
                        <BooleanPill
                          enabled={location.acceptingOrders}
                          label="Accepting orders"
                        />
                        <BooleanPill
                          enabled={location.pickupEnabled}
                          label="Pickup"
                        />
                        <BooleanPill
                          enabled={location.deliveryEnabled}
                          label="Delivery"
                        />
                      </div>

                      <dl className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">Address</dt>
                          <dd>{formatAddress(location)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Phone</dt>
                          <dd>{formatFallback(location.phone)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Email</dt>
                          <dd>{formatFallback(location.email)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Timezone</dt>
                          <dd>{location.timezone}</dd>
                        </div>
                      </dl>

                      <LocationActivationControl
                        key={`${location.id}-${location.status}-${location.isEnabled}-${location.acceptingOrders}-${location.pickupEnabled}-${location.deliveryEnabled}`}
                        business={business}
                        location={location}
                      />
                    </div>
                  </ThemedCard>
                ))}
              </div>
            )}
          </section>

          <ThemedCard className="p-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">Pricing Settings</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Business-level rules for pizza half toppings, checkout tax,
                  service fees, and tips.
                </p>
              </div>

              <BusinessPricingSettingsForm
                businessId={business.id}
                businessSlug={business.slug}
                settings={pricingSettings}
              />
            </div>
          </ThemedCard>
        </section>

        <aside className="space-y-3">
          <ThemedCard className="p-4">
            <h2 className="text-base font-semibold">Setup Status</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Business status</dt>
                <dd>
                  <StatusPill status={business.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Has location</dt>
                <dd className="font-medium">{hasLocations ? "Yes" : "No"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Ordering enabled</dt>
                <dd className="font-medium">
                  {hasOrderingEnabled ? "Yes" : "No"}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-sm text-muted-foreground">
              Setup businesses should not be public or live. Ordering should
              remain disabled until the business and at least one location are
              ready.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              A location must be active, enabled, accepting orders, and have
              pickup or delivery enabled for checkout to succeed.
            </p>
          </ThemedCard>
        </aside>
      </div>
    </ThemedPageShell>
  )
}
