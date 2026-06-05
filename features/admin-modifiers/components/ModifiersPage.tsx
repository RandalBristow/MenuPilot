import Link from "next/link"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"
import { getModifierAdminHref } from "@/features/admin-modifiers/utils/modifier-admin-routes"

const hubCards = [
  {
    title: "Modifier Categories",
    description: "Organize modifier groups for admin browsing and filtering.",
    path: "categories",
  },
  {
    title: "Modifier Groups",
    description: "Manage product-attached rule sets like required choices.",
    path: "groups",
  },
  {
    title: "Modifier Subgroups",
    description: "Group options inside a modifier group, such as sauces.",
    path: "subgroups",
  },
  {
    title: "Modifiers",
    description: "Manage selectable option items and price adjustments.",
    path: "options",
  },
]

export async function ModifiersPage({
  businessSlug,
}: {
  businessSlug?: string
} = {}) {
  return (
    <ThemedPageShell maxWidth="xl">
      <ThemedPageHeader
        title="Modifier Management"
        description="Choose a focused modifier management area."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {hubCards.map((card) => (
          <ThemedCard key={card.path} className="p-4">
            <Link
              href={getModifierAdminHref(card.path, businessSlug)}
              className="block space-y-1"
            >
              <h2 className="text-base font-semibold">{card.title}</h2>
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
            </Link>
          </ThemedCard>
        ))}
      </div>
    </ThemedPageShell>
  )
}
