import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Eye,
  Image,
  ListTree,
  MapPin,
  Package,
  SlidersHorizontal,
  Store,
  TicketPercent,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"
import {
  getProductListHref,
  getProductAdminHref,
} from "@/features/admin-products/utils/product-admin-routes"
import { getMediaAdminHref } from "@/features/admin-media/utils/media-admin-routes"
import { getModifierAdminHref } from "@/features/admin-modifiers/utils/modifier-admin-routes"
import { getSpecialAdminBaseHref } from "@/features/specials/utils/special-admin-routes"
import { BusinessPricingSettingsForm } from "@/features/pricing-settings/components/BusinessPricingSettingsForm"
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

type SetupLink = {
  label: string
  description: string
  href: string
  icon: LucideIcon
}

type SetupSection = {
  title: string
  description: string
  links: SetupLink[]
}

function getPublicMenuHref(businessSlug: string) {
  return `/businesses/${encodeURIComponent(businessSlug)}/menu`
}

function getLocationOrdersHref({
  businessSlug,
  locationSlug,
}: {
  businessSlug: string
  locationSlug: string
}) {
  return `/businesses/${encodeURIComponent(
    businessSlug
  )}/locations/${encodeURIComponent(locationSlug)}/orders`
}

function buildSetupSections({
  businessSlug,
  isSetup,
  defaultLocation,
}: {
  businessSlug: string
  isSetup: boolean
  defaultLocation?: TenantLocationContext | null
}): SetupSection[] {
  const sections: SetupSection[] = [
    {
      title: "Product Catalog",
      description: "Create products and organize the catalog customers browse.",
      links: [
        {
          label: "Categories & Subcategories",
          description:
            "Create top-level catalog categories, then manage each category's subcategories.",
          href: getProductAdminHref("categories", businessSlug),
          icon: ListTree,
        },
        {
          label: "Product List",
          description: "Browse and edit products for this business.",
          href: getProductListHref(businessSlug),
          icon: Package,
        },
      ],
    },
    {
      title: "Variants",
      description:
        "Create reusable size/count/option groups, then assign them to products.",
      links: [
        {
          label: "Variant Groups",
          description: "Build reusable size, count, or option groups.",
          href: getProductAdminHref("variant-groups", businessSlug),
          icon: SlidersHorizontal,
        },
      ],
    },
    {
      title: "Modifiers",
      description:
        "Create reusable modifier categories, groups, option lists, and options, then attach groups to products.",
      links: [
        {
          label: "Modifier Library",
          description: "Manage reusable modifier categories, groups, lists, and options.",
          href: getModifierAdminHref("", businessSlug),
          icon: SlidersHorizontal,
        },
      ],
    },
    {
      title: "Specials",
      description:
        "Create reusable discounts for products, categories, and cart totals.",
      links: [
        {
          label: "Specials",
          description:
            "Create, schedule, enable, disable, and reuse business specials.",
          href: getSpecialAdminBaseHref(businessSlug),
          icon: TicketPercent,
        },
      ],
    },
    {
      title: "Media",
      description: "Manage reusable images and media for this business.",
      links: [
        {
          label: "Media Library",
          description: "Upload, import, and organize business media assets.",
          href: getMediaAdminHref(businessSlug),
          icon: Image,
        },
      ],
    },
    {
      title: "Customer Preview",
      description: "Review the tenant-scoped public menu before real ordering.",
      links: [
        {
          label: isSetup ? "Public Menu Preview (setup)" : "Public Menu Preview",
          description: "Open the scoped customer menu for this business.",
          href: getPublicMenuHref(businessSlug),
          icon: Eye,
        },
      ],
    },
  ]

  if (defaultLocation) {
    sections.push({
      title: "Locations / Orders",
      description:
        "Open the location-scoped staff order queue for this business.",
      links: [
        {
          label: `${defaultLocation.name} Orders`,
          description:
            "View and update orders for this selected business location.",
          href: getLocationOrdersHref({
            businessSlug,
            locationSlug: defaultLocation.slug,
          }),
          icon: MapPin,
        },
      ],
    })
  }

  return sections
}

const futureSections = [
  {
    title: "Bundles / Combos",
    description: "Future BundleBuilder and ComboBuilder work.",
    icon: TicketPercent,
  },
]

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
  label,
  enabled,
}: {
  label: string
  enabled: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        enabled
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted-foreground/25 bg-muted text-muted-foreground"
      )}
    >
      {label}: {enabled ? "Yes" : "No"}
    </span>
  )
}

function isLocationCheckoutReady(location: TenantLocationContext) {
  return (
    location.isActive &&
    location.isEnabled &&
    location.acceptingOrders &&
    (location.pickupEnabled || location.deliveryEnabled)
  )
}

function getStatusNote(business: TenantBusinessContext) {
  if (business.isActive) {
    return "This business is active. Product setup, checkout, and location-scoped staff orders can use this tenant context."
  }

  if (business.isSetup) {
    return "This setup business can be managed and previewed here, but it should not accept real orders."
  }

  if (business.isPaused) {
    return "This business is paused. Admin context can be reviewed, but public ordering should remain unavailable."
  }

  if (business.isArchived) {
    return "This business is archived. Treat this context as read-only unless reactivation is intentionally built later."
  }

  return "Review this business status before enabling public ordering."
}

function SetupLinkRow({ link }: { link: SetupLink }) {
  const Icon = link.icon

  return (
    <Link
      href={link.href}
      className="flex min-w-0 gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
    >
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{link.label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {link.description}
        </span>
      </span>
    </Link>
  )
}

function SetupSectionCard({
  section,
  className,
}: {
  section: SetupSection
  className?: string
}) {
  return (
    <ThemedCard className={cn("h-full p-4", className)}>
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">{section.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {section.description}
          </p>
        </div>

        <div className="grid gap-2">
          {section.links.map((link) => (
            <SetupLinkRow key={link.href} link={link} />
          ))}
        </div>
      </div>
    </ThemedCard>
  )
}

function getSetupSection(
  sections: SetupSection[],
  title: SetupSection["title"]
) {
  return sections.find((section) => section.title === title) ?? null
}

export function TenantAdminShellPage({
  business,
  defaultLocation = null,
  pricingSettings,
}: TenantAdminShellPageProps) {
  const setupSections = buildSetupSections({
    businessSlug: business.slug,
    isSetup: business.isSetup,
    defaultLocation,
  })
  const previewLabel = business.isSetup
    ? "Public Menu Preview (setup)"
    : "Public Menu Preview"
  const leftSetupSections = [
    {
      section: getSetupSection(setupSections, "Product Catalog"),
      className: "order-1 lg:order-1",
    },
    {
      section: getSetupSection(setupSections, "Variants"),
      className: "order-2 lg:order-3",
    },
    {
      section: getSetupSection(setupSections, "Modifiers"),
      className: "order-3 lg:order-5",
    },
    {
      section: getSetupSection(setupSections, "Specials"),
      className: "order-4 lg:order-2",
    },
    {
      section: getSetupSection(setupSections, "Media"),
      className: "order-5 lg:order-4",
    },
    {
      section: getSetupSection(setupSections, "Customer Preview"),
      className: "order-6 lg:order-6",
    },
    {
      section: getSetupSection(setupSections, "Locations / Orders"),
      className: "order-7 lg:order-7",
    },
  ].filter(
    (item): item is { section: SetupSection; className: string } =>
      Boolean(item.section)
  )

  return (
    <ThemedPageShell maxWidth="xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/platform/businesses/${business.id}`}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to Platform
        </Link>

        <ThemedButton asChild variant="outline">
          <Link href="/platform/businesses">Switch Business</Link>
        </ThemedButton>
      </div>

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

            <div className="min-w-0">
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

        <p className="mt-4 text-sm text-muted-foreground">
          {getStatusNote(business)}
        </p>
      </ThemedCard>

      <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          Product, modifier library, media, and public menu reads are
          tenant-aware. Checkout and location-scoped staff orders are
          tenant-aware. Setup businesses can be managed and previewed, but
          should not accept real orders.
        </p>
      </div>

      <ThemedPageHeader
        title="Business Setup"
        description="Use this tenant-scoped setup guide for catalog, reusable configuration, media, and customer preview."
      />

      {business.isSetup ? (
        <ThemedCard className="p-4">
          <div className="flex min-w-0 gap-3">
            <Store
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-semibold">{previewLabel}</h2>
              <p className="text-sm text-muted-foreground">
                The customer menu is available as a setup preview. Ordering
                actions should remain disabled until the business and location
                activation settings are ready.
              </p>
            </div>
          </div>
        </ThemedCard>
      ) : null}

      {defaultLocation ? (
        <ThemedCard className="p-4">
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
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
              <BooleanPill
                label="Checkout ready"
                enabled={isLocationCheckoutReady(defaultLocation)}
              />
              <BooleanPill
                label="Enabled"
                enabled={defaultLocation.isEnabled}
              />
              <BooleanPill
                label="Accepting orders"
                enabled={defaultLocation.acceptingOrders}
              />
              <BooleanPill
                label="Pickup"
                enabled={defaultLocation.pickupEnabled}
              />
              <BooleanPill
                label="Delivery"
                enabled={defaultLocation.deliveryEnabled}
              />
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Checkout requires an active business, active location, enabled
              location, accepting orders, and pickup or delivery enabled. Manage
              these activation settings from Platform Admin.
            </p>
          </div>
        </ThemedCard>
      ) : null}

      <ThemedCard className="p-4">
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Pizza Pricing Settings</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Business-level rules for pizza half-topping pricing and included
              topping slot counting.
            </p>
          </div>

          <BusinessPricingSettingsForm
            businessId={business.id}
            businessSlug={business.slug}
            settings={pricingSettings}
          />
        </div>
      </ThemedCard>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        {leftSetupSections.map(({ section, className }) => (
          <SetupSectionCard
            key={section.title}
            section={section}
            className={className}
          />
        ))}

        {!defaultLocation ? (
          <ThemedCard className="order-6 h-full p-4 opacity-75 lg:order-6">
            <div className="flex min-w-0 gap-3">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              />
              <div className="min-w-0 space-y-1">
                <h2 className="text-base font-semibold">Locations / Orders</h2>
                <p className="text-sm text-muted-foreground">
                  Add a location before opening a location-scoped staff order
                  queue.
                </p>
              </div>
            </div>
          </ThemedCard>
        ) : null}
      </div>

      <ThemedPageHeader
        title="Future / Not Ready"
        description="These areas stay disabled until their tenant-aware flows are ready."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {futureSections.map((section) => {
          const Icon = section.icon

          return (
            <ThemedCard key={section.title} className="p-4 opacity-75">
              <div className="flex min-w-0 gap-3">
                <Icon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">
                      {section.title}
                    </h2>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Future
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
            </ThemedCard>
          )
        })}
      </div>
    </ThemedPageShell>
  )
}
