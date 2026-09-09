import { notFound } from "next/navigation"
import { TenantCatalogPage } from "@/features/tenant/components/TenantCatalogPage"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"

export default async function BusinessCatalogRoutePage({
  params,
}: {
  params: Promise<{ businessSlug: string }>
}) {
  const { businessSlug } = await params
  const business = await resolveBusinessContext({ businessSlug })

  if (!business) notFound()

  return <TenantCatalogPage business={business} />
}
