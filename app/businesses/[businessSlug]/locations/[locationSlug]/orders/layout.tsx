import { requireLocationAccess } from "@/features/auth/server/authorization"
import { WorkforceSessionControls } from "@/features/auth/components/WorkforceSessionControls"

export default async function StaffOrdersLayout({ children, params }: { children: React.ReactNode; params: Promise<{ businessSlug: string; locationSlug: string }> }) {
  const { businessSlug, locationSlug } = await params
  await requireLocationAccess({ businessSlug, locationSlug, roles: ["owner", "admin", "manager", "staff"], next: `/businesses/${businessSlug}/locations/${locationSlug}/orders` })
  return <><WorkforceSessionControls />{children}</>
}
