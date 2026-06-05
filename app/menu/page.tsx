import { getMenuByBusinessSlug } from "@/features/menu/queries/get-menu"
import { MenuClient } from "@/features/menu/components/MenuClient"
import { LEGACY_MENU_BUSINESS_SLUG } from "@/features/menu/utils/legacy-menu-context"

export default async function MenuRoutePage() {
  const { business, menus } = await getMenuByBusinessSlug(
    LEGACY_MENU_BUSINESS_SLUG
  )
  const menu = menus?.[0]

  if (!menu) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>No menu found.</p>
      </main>
    )
  }

  return (
    <MenuClient
      businessName={business.name}
      businessSlug={business.slug}
      businessStatus={business.status}
      menu={menu}
    />
  )
}
