import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ModifierOptionsBrowser } from "@/features/admin-modifiers/components/ModifierOptionsBrowser"
import { getModifierAdminData } from "@/features/admin-modifiers/queries/get-modifier-admin-data"

export async function ManagerModifierAvailabilityPage({
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
  const { categories } = await getModifierAdminData(
    { businessId },
    locationId
  )
  const managerHref = `/businesses/${encodeURIComponent(
    businessSlug
  )}/locations/${encodeURIComponent(locationSlug)}/manager`

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <ThemedPageHeader
          backHref={managerHref}
          backLabel="Manager Dashboard"
          title={`${locationName} Modifier Availability`}
          description={`Enable or disable toppings and other choices for ${businessName}, ${locationName}.`}
          className="shrink-0"
        />

        <div className="min-h-0 flex-1">
          <ModifierOptionsBrowser
            categories={categories}
            businessSlug={businessSlug}
            locationSlug={locationSlug}
            availabilityOnly
          />
        </div>
      </div>
    </main>
  )
}
