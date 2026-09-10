import Link from "next/link"
import { redirect } from "next/navigation"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { getWorkforceIdentity, isDevelopmentAccessEnabled } from "@/features/auth/server/identity"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams
  if (await getWorkforceIdentity()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/auth/continue")
  const developmentAccess = await isDevelopmentAccessEnabled()

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6">
        <div className="space-y-2 text-center">
          <ThemedHeading>MenuPilot Workforce Login</ThemedHeading>
          <p className="text-sm text-muted-foreground">For platform owners, business owners, managers, and employees.</p>
        </div>
        <LoginForm next={next || null} />
        {developmentAccess ? <Link href="/dev/access" className="text-sm font-medium text-muted-foreground hover:text-foreground">Use development access</Link> : null}
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Return to customer site</Link>
      </div>
    </main>
  )
}
