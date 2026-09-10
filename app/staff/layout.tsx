import { requireBusinessAccess } from "@/features/auth/server/authorization"
import { WorkforceSessionControls } from "@/features/auth/components/WorkforceSessionControls"

export default async function LegacyStaffLayout({ children }: { children: React.ReactNode }) {
  await requireBusinessAccess({ businessSlug: "pronto-demo", roles: ["owner", "admin", "manager", "staff"], next: "/staff/orders" })
  return <><WorkforceSessionControls />{children}</>
}
