import { SpecialsAdminPage } from "@/features/specials/components/SpecialsAdminPage"

type BusinessSpecialsRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessSpecialsRoutePage({
  params,
}: BusinessSpecialsRoutePageProps) {
  const { businessSlug } = await params

  return <SpecialsAdminPage businessSlug={businessSlug} />
}
