import Link from "next/link"
import { ClipboardList, CircleSlash2, Settings2, SlidersHorizontal } from "lucide-react"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"

export function ManagerDashboardPage({
  businessName,
  locationName,
  businessSlug,
  locationSlug,
}: {
  businessName: string
  locationName: string
  businessSlug: string
  locationSlug: string
}) {
  const baseHref = `/businesses/${encodeURIComponent(businessSlug)}/locations/${encodeURIComponent(locationSlug)}/manager`
  const links = [
    {
      title: "Orders",
      description: "Review incoming orders and move them through preparation.",
      href: `${baseHref}/orders`,
      icon: ClipboardList,
    },
    {
      title: "Product Availability",
      description: "Enable or disable products for this location.",
      href: `${baseHref}/availability`,
      icon: CircleSlash2,
    },
    {
      title: "Modifier Availability",
      description: "Enable or disable toppings and other choices for this location.",
      href: `${baseHref}/modifier-availability`,
      icon: SlidersHorizontal,
    },
  ]

  return (
    <ThemedPageShell maxWidth="lg">
      <ThemedPageHeader
        title={`${locationName} Manager`}
        description={`${businessName} location operations.`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="block">
              <ThemedCard className="h-full p-4 transition-colors hover:bg-muted/40">
                <div className="flex gap-3">
                  <Icon className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </ThemedCard>
            </Link>
          )
        })}
        <ThemedCard className="p-4 opacity-65">
          <div className="flex gap-3">
            <Settings2 className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Catalog Editing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manager product editing will be enabled after permissions are defined.
              </p>
            </div>
          </div>
        </ThemedCard>
      </div>
    </ThemedPageShell>
  )
}
