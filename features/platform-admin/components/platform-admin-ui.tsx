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
} from "@/features/platform-admin/types/platform-admin"
import { PlatformBusinessPageForm } from "@/features/platform-admin/components/PlatformBusinessPageForm"
import type { BusinessPricingSettings } from "@/lib/pricing/business-pricing-settings"
import { cn } from "@/lib/utils"

function formatFallback(value: string | null | undefined) {
  return value?.trim() ? value : "Not set"
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

      <PlatformBusinessPageForm
        business={business}
        pricingSettings={pricingSettings}
      />
    </ThemedPageShell>
  )
}
