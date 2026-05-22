import { ModifierGroupViewPage } from "@/features/admin-modifiers/components/ModifierGroupViewPage"

type AdminModifierGroupRoutePageProps = {
  params: Promise<{
    groupId: string
  }>
  searchParams: Promise<{
    productId?: string
  }>
}

export default async function AdminModifierGroupRoutePage({
  params,
  searchParams,
}: AdminModifierGroupRoutePageProps) {
  const { groupId } = await params
  const { productId } = await searchParams

  return <ModifierGroupViewPage groupId={groupId} productId={productId} />
}
