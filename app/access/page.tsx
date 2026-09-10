import Link from "next/link"
import { redirect } from "next/navigation"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { signOut } from "@/features/auth/actions/sign-out"
import { getWorkforceIdentity, isPlatformOwnerEmail } from "@/features/auth/server/identity"
import { supabaseAdmin } from "@/lib/supabase/admin"

export default async function AccessPage() {
  const identity = await getWorkforceIdentity()
  if (!identity) redirect("/login")
  if (identity.development) redirect("/auth/continue")

  const { data: memberships } = await supabaseAdmin.from("business_users").select("business_id, role, businesses(name, slug)").eq("user_id", identity.userId!).eq("is_enabled", true)
  const { data: assignments } = await supabaseAdmin.from("location_users").select("business_id, role, locations(name, slug), businesses(name, slug)").eq("user_id", identity.userId!).eq("is_enabled", true)

  return <main className="min-h-screen bg-background px-4 py-12"><div className="mx-auto max-w-2xl space-y-6"><div className="flex items-start justify-between gap-4"><div><ThemedHeading>Choose a Workspace</ThemedHeading><p className="mt-2 text-sm text-muted-foreground">Select the business or location you want to open.</p></div><form action={signOut}><ThemedButton type="submit" variant="outline">Sign Out</ThemedButton></form></div><div className="space-y-3">{isPlatformOwnerEmail(identity.email) ? <ThemedCard className="p-4"><ThemedButton asChild><Link href="/platform">Platform Administration</Link></ThemedButton></ThemedCard> : null}{(memberships ?? []).filter((item) => item.role === "owner" || item.role === "admin").map((item) => { const business = item.businesses as unknown as { name: string; slug: string } | null; return business ? <ThemedCard key={`${item.business_id}-${item.role}`} className="flex items-center justify-between gap-3 p-4"><div><p className="font-semibold">{business.name}</p><p className="text-sm capitalize text-muted-foreground">{item.role}</p></div><ThemedButton asChild><Link href={`/businesses/${business.slug}/admin`}>Open</Link></ThemedButton></ThemedCard> : null })}{(assignments ?? []).map((item, index) => { const business = item.businesses as unknown as { name: string; slug: string } | null; const location = item.locations as unknown as { name: string; slug: string } | null; if (!business || !location) return null; const href = item.role === "manager" ? `/businesses/${business.slug}/locations/${location.slug}/manager` : `/businesses/${business.slug}/locations/${location.slug}/orders`; return <ThemedCard key={`${item.business_id}-${location.slug}-${index}`} className="flex items-center justify-between gap-3 p-4"><div><p className="font-semibold">{business.name} — {location.name}</p><p className="text-sm capitalize text-muted-foreground">{item.role}</p></div><ThemedButton asChild><Link href={href}>Open</Link></ThemedButton></ThemedCard> })}</div></div></main>
}
