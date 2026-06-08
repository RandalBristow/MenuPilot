import { SpecialFormPage } from "@/features/specials/components/SpecialFormPage"

type BusinessNewSpecialRoutePageProps = {
  params: Promise<{
    businessSlug: string
  }>
}

export default async function BusinessNewSpecialRoutePage({
  params,
}: BusinessNewSpecialRoutePageProps) {
  const { businessSlug } = await params

  return <SpecialFormPage businessSlug={businessSlug} />
}
