import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, ShoppingBag, Store } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"
import { getCheckoutOrderability } from "@/features/checkout/utils/checkout-tenant-context"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"
import { resolveDefaultLocationContext } from "@/features/tenant/queries/resolve-location-context"
import type {
  TenantBusinessContext,
  TenantLocationContext,
} from "@/features/tenant/types/tenant-context"
import { cn } from "@/lib/utils"

type BusinessStorefrontRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

function getStorefrontStatusMessage({
  business,
  defaultLocation,
}: {
  business: TenantBusinessContext
  defaultLocation: TenantLocationContext | null
}) {
  if (business.isSetup) {
    return "Preview mode: this business is still in setup and is not accepting public orders."
  }

  if (business.isPaused) {
    return "This storefront is paused and is not accepting orders right now."
  }

  if (business.isArchived) {
    return "This storefront is archived and is not accepting orders."
  }

  if (!business.isActive) {
    return "This storefront is not accepting orders right now."
  }

  if (!defaultLocation) {
    return "This business does not have an orderable location yet."
  }

  const orderability = getCheckoutOrderability({
    business,
    location: defaultLocation,
  })

  return orderability.ok
    ? "Browse the menu and place an order online."
    : orderability.reason
}

export default async function BusinessStorefrontRoutePage({
  params,
}: BusinessStorefrontRoutePageProps) {
  const { businessSlug } = await params
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) {
    notFound()
  }

  const defaultLocation = await resolveDefaultLocationContext({
    businessId: business.id,
  })
  const orderability = defaultLocation
    ? getCheckoutOrderability({ business, location: defaultLocation })
    : { ok: false as const, reason: "No location is available for checkout." }
  const isOrderable = orderability.ok
  const menuHref = `/businesses/${encodeURIComponent(business.slug)}/menu`
  const checkoutHref = `/businesses/${encodeURIComponent(business.slug)}/checkout`
  const statusMessage = getStorefrontStatusMessage({
    business,
    defaultLocation,
  })

  return (
    <ThemedPageShell maxWidth="lg" className="py-6 sm:py-10">
      <ThemedCard className="overflow-hidden">
        <section className="space-y-6 p-5 sm:p-7">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Store className="size-4" aria-hidden="true" />
            <span>MenuPilot storefront</span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                {business.name}
              </h1>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal",
                  business.isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}
              >
                {business.status}
              </span>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {statusMessage}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ThemedButton asChild size="lg" className="h-11 justify-between px-4">
              <Link href={menuHref}>
                <span>View menu</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </ThemedButton>
            {isOrderable ? (
              <ThemedButton
                asChild
                variant="outline"
                size="lg"
                className="h-11 justify-between bg-background px-4 text-foreground hover:bg-muted"
              >
                <Link href={checkoutHref}>
                  <span>Checkout</span>
                  <ShoppingBag className="size-4" aria-hidden="true" />
                </Link>
              </ThemedButton>
            ) : null}
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 p-5 sm:p-7">
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div className="space-y-1">
              <dt className="font-medium text-muted-foreground">Ordering</dt>
              <dd className="font-semibold text-foreground">
                {isOrderable ? "Available" : "Unavailable"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium text-muted-foreground">Location</dt>
              <dd className="font-semibold text-foreground">
                {defaultLocation?.name ?? "Not set"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium text-muted-foreground">Storefront</dt>
              <dd className="font-semibold text-foreground">
                {business.isActive ? "Active" : "Preview"}
              </dd>
            </div>
          </dl>
        </section>
      </ThemedCard>
    </ThemedPageShell>
  )
}
