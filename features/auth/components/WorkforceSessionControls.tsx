import Link from "next/link"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { signOut } from "@/features/auth/actions/sign-out"
import { isDevelopmentAccessEnabled } from "@/features/auth/server/identity"

export async function WorkforceSessionControls() {
  const developmentAccess = await isDevelopmentAccessEnabled()
  return <div className="fixed right-3 top-3 z-40 flex gap-2 rounded-md border bg-background/95 p-1 shadow-sm backdrop-blur">{developmentAccess ? <ThemedButton asChild variant="outline" size="sm"><Link href="/dev/access">Switch Role</Link></ThemedButton> : null}<form action={signOut}><ThemedButton type="submit" variant="outline" size="sm">Sign Out</ThemedButton></form></div>
}
