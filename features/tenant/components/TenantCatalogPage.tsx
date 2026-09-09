import Link from "next/link"
import {
  ArrowLeft,
  ListTree,
  Package,
  SlidersHorizontal,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"
import {
  getProductAdminHref,
  getProductListHref,
} from "@/features/admin-products/utils/product-admin-routes"
import { getModifierAdminHref } from "@/features/admin-modifiers/utils/modifier-admin-routes"
import type { TenantBusinessContext } from "@/features/tenant/types/tenant-context"

type CatalogLink = {
  label: string
  description: string
  href: string
  icon: LucideIcon
}

type CatalogSection = {
  title: string
  description: string
  links: CatalogLink[]
}

function CatalogSectionCard({ section }: { section: CatalogSection }) {
  return (
    <ThemedCard className="h-full p-4">
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">{section.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {section.description}
          </p>
        </div>

        <div className="grid gap-2">
          {section.links.map((link) => {
            const Icon = link.icon

            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-w-0 gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <Icon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {link.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {link.description}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </ThemedCard>
  )
}

export function TenantCatalogPage({
  business,
}: {
  business: TenantBusinessContext
}) {
  const sections: CatalogSection[] = [
    {
      title: "Products",
      description: "Create products and organize the menu customers browse.",
      links: [
        {
          label: "Categories & Subcategories",
          description:
            "Create top-level categories, then organize their subcategories.",
          href: getProductAdminHref("categories", business.slug),
          icon: ListTree,
        },
        {
          label: "Product List",
          description: "Browse, create, and edit products for this business.",
          href: getProductListHref(business.slug),
          icon: Package,
        },
      ],
    },
    {
      title: "Variants",
      description:
        "Create reusable size, count, and option groups, then assign them to products.",
      links: [
        {
          label: "Variant Groups",
          description: "Build reusable size, count, or option groups.",
          href: getProductAdminHref("variant-groups", business.slug),
          icon: SlidersHorizontal,
        },
      ],
    },
    {
      title: "Modifiers",
      description:
        "Create reusable modifier groups, option lists, and customer choices.",
      links: [
        {
          label: "Modifier Library",
          description:
            "Manage reusable modifier categories, groups, lists, and options.",
          href: getModifierAdminHref("", business.slug),
          icon: SlidersHorizontal,
        },
      ],
    },
  ]

  return (
    <ThemedPageShell maxWidth="xl">
      <Link
        href={`/businesses/${encodeURIComponent(business.slug)}/admin`}
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Business Admin
      </Link>

      <ThemedPageHeader
        title={`${business.name} Product Catalog`}
        description="Manage products and the reusable configuration used to build them."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <CatalogSectionCard key={section.title} section={section} />
        ))}
      </div>
    </ThemedPageShell>
  )
}
