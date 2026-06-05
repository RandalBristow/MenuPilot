import { notFound } from "next/navigation"
import { VariantGroupDetailClient } from "@/features/admin-products/components/VariantGroupDetailClient"
import { getVariantGroupDetail } from "@/features/admin-products/queries/get-variant-groups"
import type { ProductAdminBusinessContextInput } from "@/features/admin-products/utils/product-admin-business-context"

type VariantGroupDetailPageProps = {
  groupId: string
  productId?: string
  businessContext?: ProductAdminBusinessContextInput
  businessSlug?: string
  writesEnabled?: boolean
}

export async function VariantGroupDetailPage({
  groupId,
  productId,
  businessContext,
  businessSlug,
  writesEnabled = true,
}: VariantGroupDetailPageProps) {
  const data = await getVariantGroupDetail(groupId, productId, businessContext)

  if (!data) {
    notFound()
  }

  return (
    <VariantGroupDetailClient
      data={data}
      businessSlug={businessSlug}
      writesEnabled={writesEnabled}
    />
  )
}
