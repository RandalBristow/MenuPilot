import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Eye,
  Image,
  MapPin,
  Package,
  TicketPercent,
  UserRoundCog,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"
import { getMediaAdminHref } from "@/features/admin-media/utils/media-admin-routes"
import { BusinessPricingSettingsForm } from "@/features/pricing-settings/components/BusinessPricingSettingsForm"
import { getSpecialAdminBaseHref } from "@/features/specials/utils/special-admin-routes"
import type {
  TenantBusinessContext,
  TenantLocationContext,
} from "@/features/tenant/types/tenant-context"
import type { BusinessPricingSettings } from "@/lib/pricing/business-pricing-settings"
import { cn } from "@/lib/utils"

type TenantAdminShellPageProps = {
  business: TenantBusinessContext
  defaultLocation?: TenantLocationContext | null
  pricingSettings: BusinessPricingSettings
}

type DashboardLink = {
  title: string
  description: string
  href: string | null
  icon: LucideIcon
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        status === "active"
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted-foreground/25 bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  )
}

function StatePill({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        enabled
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted-foreground/25 bg-muted text-muted-foreground"
      )}
    >
      {label}: {enabled ? "Yes" : "No"}
    </span>
  )
}

function isCheckoutReady(location: TenantLocationContext) {
  return (
    location.isActive &&
    location.acceptingOrders &&
    (location.pickupEnabled || location.deliveryEnabled)
  )
}

export function TenantAdminShellPage({
  business,
  defaultLocation = null,
  pricingSettings,
}: TenantAdminShellPageProps) {
  const baseHref = `/businesses/${encodeURIComponent(business.slug)}`
  const dashboardLinks: DashboardLink[] = [
    {
      title: "Product Catalog",
      description: "Manage products, categories, variants, and modifiers.",
      href: `${baseHref}/admin/catalog`,
      icon: Package,
    },
    {
      title: "Specials & Promotions",
      description: "Create, schedule, enable, and reuse specials and deals.",
      href: getSpecialAdminBaseHref(business.slug),
      icon: TicketPercent,
    },
    {
      title: "Media Library",
      description: "Manage product, branding, website, and menu images.",
      href: getMediaAdminHref(business.slug),
      icon: Image,
    },
    {
      title: "Orders & Operations",
      description: defaultLocation
        ? `Open the ${defaultLocation.name} staff order queue.`
        : "Add a location before opening the staff order queue.",
      href: defaultLocation
        ? `${baseHref}/locations/${encodeURIComponent(defaultLocation.slug)}/orders`
        : null,
      icon: MapPin,
    },
    {
      title: "Storefront Preview",
      description: business.isSetup
        ? "Preview the customer menu with ordering disabled during setup."
        : "Open the customer-facing menu for this business.",
      href: `${baseHref}/menu`,
      icon: Eye,
    },
    {
      title: "Manage Employees",
      description: "Manage employee details, locations, roles, and permissions.",
      href: `${baseHref}/admin/employees`,
      icon: UserRoundCog,
    },
  ]

  return (
    <ThemedPageShell maxWidth="xl">
      <Link
        href={`/platform/businesses/${business.id}`}
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to Platform
      </Link>

      <ThemedCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Building2
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
              <p className="text-sm font-medium text-muted-foreground">
                Platform Admin Mode
              </p>
            </div>
            <div>
              <h1 className="font-heading text-2xl font-medium leading-tight">
                Managing: {business.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Business slug: {business.slug}
              </p>
            </div>
          </div>
          <StatusPill status={business.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {dashboardLinks.map((item) => {
            const Icon = item.icon

            return item.href ? (
              <ThemedButton key={item.title} asChild variant="outline">
                <Link href={item.href} title={item.description}>
                  <Icon aria-hidden="true" className="size-4" />
                  {item.title}
                </Link>
              </ThemedButton>
            ) : (
              <ThemedButton
                key={item.title}
                type="button"
                variant="outline"
                disabled
                title={item.description}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.title}
              </ThemedButton>
            )
          })}
        </div>
      </ThemedCard>

      <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          Auth and role protection are deferred. Keep this administration area
          internal until access controls are implemented.
        </p>
      </div>

      {defaultLocation ? (
        <ThemedCard className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  Location Orderability
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Default location: {defaultLocation.name}
                </p>
              </div>
              <StatusPill status={defaultLocation.status} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <StatePill
                label="Checkout ready"
                enabled={isCheckoutReady(defaultLocation)}
              />
              <StatePill
                label="Accepting orders"
                enabled={defaultLocation.acceptingOrders}
              />
              <StatePill label="Pickup" enabled={defaultLocation.pickupEnabled} />
              <StatePill
                label="Delivery"
                enabled={defaultLocation.deliveryEnabled}
              />
            </div>
          </div>
        </ThemedCard>
      ) : null}

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
    </ThemedPageShell>
  )
}
