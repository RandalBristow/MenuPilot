import { notFound } from "next/navigation"
import { EmployeePermissionsPage } from "@/features/employee-permissions/components/EmployeePermissionsPage"
import { resolveBusinessContext } from "@/features/tenant/queries/resolve-business-context"

export default async function BusinessEmployeePermissionsRoutePage({
  params,
}: {
  params: Promise<{ businessSlug: string }>
}) {
  const { businessSlug } = await params
  const business = await resolveBusinessContext({ businessSlug })
  if (!business) notFound()
  return <EmployeePermissionsPage business={business} />
}
