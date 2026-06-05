import { notFound } from "next/navigation"
import { ProductModifierAvailabilityClient } from "@/features/admin-products/components/ProductModifierAvailabilityClient"
import { getProductModifierAvailabilityData } from "@/features/admin-products/queries/get-product-modifier-availability"
import type { ProductAdminBusinessContextInput } from "@/features/admin-products/utils/product-admin-business-context"

type ProductModifierAvailabilityPageProps = {
  productId?: string
  modifierGroupId: string
  businessContext?: ProductAdminBusinessContextInput
  businessSlug?: string
  writesEnabled?: boolean
}

export async function ProductModifierAvailabilityPage({
  productId,
  modifierGroupId,
  businessContext,
  businessSlug,
  writesEnabled = true,
}: ProductModifierAvailabilityPageProps) {
  const data = await getProductModifierAvailabilityData({
    productId,
    modifierGroupId,
    businessContext,
  })

  if (!data) {
    notFound()
  }

  return (
    <ProductModifierAvailabilityClient
      data={data}
      businessSlug={businessSlug}
      writesEnabled={writesEnabled}
    />
  )
}
