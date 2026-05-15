import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"

const productHubLinks = [
  {
    title: "Product Categories",
    href: "/admin/products/categories",
    description: "Manage top-level menu categories for products.",
  },
  {
    title: "Product Subcategories",
    href: "/admin/products/subcategories",
    description: "Organize products inside parent categories.",
  },
  {
    title: "Products",
    href: "/admin/products/list",
    description: "Browse and edit product records.",
  },
  {
    title: "Variant Groups",
    href: "/admin/products/variant-groups",
    description: "Manage reusable size, drink, and count groups.",
  },
  {
    title: "Product Modifier Groups",
    href: "/admin/products/modifier-groups",
    description: "Attach modifier groups to products.",
  },
]

export function ProductManagementHub() {
  return (
    <ThemedPageShell
      maxWidth="lg"
      className="h-dvh min-h-screen overflow-hidden"
    >
      <div className="flex h-[calc(100dvh-2.5rem)] min-h-0 flex-col">
        <ThemedPageHeader
          title="Product Management"
          description="Choose a focused product management area."
          className="shrink-0 border-b pb-3"
        />

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto py-3">
          <div className="grid gap-3">
            {productHubLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={`Open ${item.title}`}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ThemedCard className="gap-1 p-3 transition-colors hover:bg-muted/40">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="m-0 text-base font-semibold">
                        {item.title}
                      </h2>
                      <p className="m-0 mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted-foreground"
                    />
                  </div>
                </ThemedCard>
              </Link>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t" aria-hidden="true" />
      </div>
    </ThemedPageShell>
  )
}
