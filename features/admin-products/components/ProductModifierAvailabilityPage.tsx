import { notFound } from "next/navigation"
import { ProductModifierAvailabilityClient } from "@/features/admin-products/components/ProductModifierAvailabilityClient"
import { getProductModifierAvailabilityData } from "@/features/admin-products/queries/get-product-modifier-availability"

type ProductModifierAvailabilityPageProps = {
  productId?: string
  modifierGroupId: string
}

export async function ProductModifierAvailabilityPage({
  productId,
  modifierGroupId,
}: ProductModifierAvailabilityPageProps) {
  const data = await getProductModifierAvailabilityData({
    productId,
    modifierGroupId,
  })

  if (!data) {
    notFound()
  }

  return <ProductModifierAvailabilityClient data={data} />
}
