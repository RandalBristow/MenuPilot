import { PlatformBusinessesPage } from "@/features/platform-admin/components/platform-admin-ui"
import { getPlatformBusinesses } from "@/features/platform-admin/queries/get-platform-businesses"

export default async function PlatformBusinessesRoutePage() {
  const businesses = await getPlatformBusinesses()

  return <PlatformBusinessesPage businesses={businesses} />
}
