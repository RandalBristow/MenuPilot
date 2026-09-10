import { requireLocationAccess } from "@/features/auth/server/authorization"
import { WorkforceSessionControls } from "@/features/auth/components/WorkforceSessionControls"

export default async function ManagerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ businessSlug: string; locationSlug: string }> }) {
  const { businessSlug, locationSlug } = await params
  await requireLocationAccess({ businessSlug, locationSlug, roles: ["owner", "admin", "manager"], next: `/businesses/${businessSlug}/locations/${locationSlug}/manager` })
  return <><WorkforceSessionControls />{children}</>
}
