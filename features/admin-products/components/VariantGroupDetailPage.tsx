import { notFound } from "next/navigation"
import { VariantGroupDetailClient } from "@/features/admin-products/components/VariantGroupDetailClient"
import { getVariantGroupDetail } from "@/features/admin-products/queries/get-variant-groups"

type VariantGroupDetailPageProps = {
  groupId: string
  productId?: string
}

export async function VariantGroupDetailPage({
  groupId,
  productId,
}: VariantGroupDetailPageProps) {
  const data = await getVariantGroupDetail(groupId, productId)

  if (!data) {
    notFound()
  }

  return <VariantGroupDetailClient data={data} />
}
