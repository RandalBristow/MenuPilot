import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import {
  getAdminProductsPageData,
} from "@/features/admin-products/components/AdminProductsPage"
import { AdminProductsBrowser } from "@/features/admin-products/components/AdminProductsBrowser"

export async function ManagerAvailabilityPage({
  businessId,
  locationId,
  businessName,
  locationName,
  businessSlug,
  locationSlug,
}: {
  businessId: string
  locationId: string
  businessName: string
  locationName: string
  businessSlug: string
  locationSlug: string
}) {
  const { menuGroups } = await getAdminProductsPageData(
    { businessId },
    locationId
  )
  const managerHref = `/businesses/${encodeURIComponent(
    businessSlug
  )}/locations/${encodeURIComponent(locationSlug)}/manager`

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-col space-y-4">
        <ThemedPageHeader
          backHref={managerHref}
          backLabel="Manager Dashboard"
          title={`${locationName} Product Availability`}
          description={`Enable or disable products for ${businessName}, ${locationName}.`}
          className="shrink-0"
        />

        <div className="min-h-0 flex-1">
          <AdminProductsBrowser
            menuGroups={menuGroups}
            businessSlug={businessSlug}
            locationSlug={locationSlug}
            availabilityOnly
          />
        </div>
      </div>
    </main>
  )
}
