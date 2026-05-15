import { VariantGroupsBrowser } from "@/features/admin-products/components/VariantGroupsBrowser"
import { getVariantGroups } from "@/features/admin-products/queries/get-variant-groups"

export async function VariantGroupsPage() {
  const data = await getVariantGroups()

  return <VariantGroupsBrowser data={data} />
}
