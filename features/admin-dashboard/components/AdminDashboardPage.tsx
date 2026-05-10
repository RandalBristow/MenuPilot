import Link from "next/link"
import { ThemedButton } from "@/components/themed/ThemedButton"
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
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <ThemedHeading>MenuPilot Admin</ThemedHeading>
          <p className="text-sm text-muted-foreground">
            Quick links for managing the demo menu and order flow.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((item) => (
            <ThemedCard key={item.href} className="flex flex-col p-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <ThemedButton asChild className="mt-5 w-full">
                <Link href={item.href}>Open</Link>
              </ThemedButton>
            </ThemedCard>
          ))}
        </div>
      </div>
    </main>
  )
}
