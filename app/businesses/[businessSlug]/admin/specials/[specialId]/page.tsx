import { SpecialFormPage } from "@/features/specials/components/SpecialFormPage"

type BusinessSpecialDetailRoutePageProps = {
  params: Promise<{
    businessSlug: string
    specialId: string
  }>
}

export default async function BusinessSpecialDetailRoutePage({
  params,
}: BusinessSpecialDetailRoutePageProps) {
  const { businessSlug, specialId } = await params

  return <SpecialFormPage businessSlug={businessSlug} specialId={specialId} />
}
