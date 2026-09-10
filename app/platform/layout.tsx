import { requirePlatformOwner } from "@/features/auth/server/authorization"
import { WorkforceSessionControls } from "@/features/auth/components/WorkforceSessionControls"

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformOwner("/platform")
  return <><WorkforceSessionControls />{children}</>
}
