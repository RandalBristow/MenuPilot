import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"
import { EmployeePermissionsForm } from "@/features/employee-permissions/components/EmployeePermissionsForm"
import { getEmployeePermissions } from "@/features/employee-permissions/queries/get-employee-permissions"
import type { TenantBusinessContext } from "@/features/tenant/types/tenant-context"

export async function EmployeePermissionsPage({ business }: { business: TenantBusinessContext }) {
  const { assignments, locations } = await getEmployeePermissions(business.id)
  return (
    <ThemedPageShell maxWidth="lg">
      <ThemedPageHeader
        backHref={`/businesses/${encodeURIComponent(business.slug)}/admin`}
        backLabel="Business Admin"
        title={`${business.name} Manage Employees`}
        description="Add employees and manage their details, role, locations, and permissions."
      />
      <EmployeePermissionsForm
        businessSlug={business.slug}
        assignments={assignments}
        locations={locations}
      />
    </ThemedPageShell>
  )
}
