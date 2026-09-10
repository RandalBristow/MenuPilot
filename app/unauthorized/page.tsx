import Link from "next/link"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { signOut } from "@/features/auth/actions/sign-out"

export default function UnauthorizedPage() {
  return <main className="min-h-screen bg-background px-4 py-12"><ThemedCard className="mx-auto max-w-lg space-y-4 p-6 text-center"><ThemedHeading>Access Denied</ThemedHeading><p className="text-sm text-muted-foreground">Your account does not have permission to open this area.</p><div className="flex justify-center gap-2"><ThemedButton asChild variant="outline"><Link href="/auth/continue">Open my workspace</Link></ThemedButton><form action={signOut}><ThemedButton type="submit">Sign Out</ThemedButton></form></div></ThemedCard></main>
}
