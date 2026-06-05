import { notFound } from "next/navigation"
import { MenuClient } from "@/features/menu/components/MenuClient"
import { getMenuByBusinessSlug } from "@/features/menu/queries/get-menu"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"

type BusinessMenuRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessMenuRoutePage({
  params,
}: BusinessMenuRoutePageProps) {
  const { businessSlug } = await params
  const businessContext = await resolveBusinessContext({ businessSlug })

  if (!businessContext) {
    notFound()
  }

  const { business, menus } = await getMenuByBusinessSlug(businessContext.slug)
  const menu = menus?.[0]

  if (!menu) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-2xl space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            MenuPilot
          </p>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          {business.status === "setup" ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              Preview mode: this business is in setup and is not accepting
              public orders.
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">No menu found.</p>
        </div>
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
