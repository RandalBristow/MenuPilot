import Link from "next/link"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedHeading } from "@/components/themed/ThemedHeading"

const adminLinks = [
  {
    title: "Products",
    href: "/admin/products",
    description: "Create and manage products, categories, variants, and modifiers.",
  },
  {
    title: "Modifiers",
    href: "/admin/modifiers",
    description: "Review modifier groups, options, subgroups, and enabled states.",
  },
  {
    title: "Staff Orders",
    href: "/staff/orders",
    description: "Open the staff order queue for fulfillment workflows.",
  },
  {
    title: "Public Menu",
    href: "/menu",
    description: "View the customer-facing menu experience.",
  },
  {
    title: "Checkout Test",
    href: "/checkout",
    description: "Open the checkout page for basic ordering tests.",
  },
]

export function AdminDashboardPage() {
  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-2 border-b pb-3">
          <ThemedHeading>MenuPilot Admin</ThemedHeading>
          <p className="text-sm text-muted-foreground">
            Quick links for managing the demo menu and order flow.
          </p>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adminLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={`Open ${item.title}`}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ThemedCard className="min-h-full gap-1 p-4 transition-colors hover:bg-muted/40">
                  <h2 className="m-0 text-lg font-semibold">{item.title}</h2>
                  <p className="m-0 mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </ThemedCard>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
