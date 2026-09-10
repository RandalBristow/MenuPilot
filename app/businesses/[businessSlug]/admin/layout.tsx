import { requireBusinessAccess } from "@/features/auth/server/authorization"
import { WorkforceSessionControls } from "@/features/auth/components/WorkforceSessionControls"

export default async function BusinessAdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params
  await requireBusinessAccess({ businessSlug, roles: ["owner", "admin"], next: `/businesses/${businessSlug}/admin` })
  return <><WorkforceSessionControls />{children}</>
}
