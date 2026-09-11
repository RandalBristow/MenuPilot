import { ThemedSelect } from "@/components/themed/ThemedSelect"
import { redirect } from "next/navigation"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { setDevelopmentAccess } from "@/features/auth/actions/set-development-access"
import { isDevelopmentAccessEnabled } from "@/features/auth/server/identity"
import { supabaseAdmin } from "@/lib/supabase/admin"

export default async function DevelopmentAccessPage() {
  if (!(await isDevelopmentAccessEnabled())) redirect("/login")
  const [{ data: businesses }, { data: locations }] = await Promise.all([
    supabaseAdmin.from("businesses").select("id, name, slug").order("name"),
    supabaseAdmin.from("locations").select("id, name, business_id, businesses(name)").order("name"),
  ])
  return <main className="min-h-screen bg-background px-4 py-12"><div className="mx-auto max-w-lg space-y-6"><div><ThemedHeading>Development Access</ThemedHeading><p className="mt-2 text-sm text-muted-foreground">Choose a test role and context. This bypass is restricted to localhost development.</p></div><ThemedCard className="p-5"><form action={setDevelopmentAccess} className="space-y-4"><label className="grid gap-2 text-sm"><span className="font-medium">Role</span><ThemedSelect name="role" className="h-10 rounded-md border bg-background px-3"><option value="platform">Platform Owner</option><option value="owner">Business Owner</option><option value="admin">Business Admin</option><option value="manager">Manager</option><option value="staff">Staff Employee</option></ThemedSelect></label><label className="grid gap-2 text-sm"><span className="font-medium">Business</span><ThemedSelect name="businessId" className="h-10 rounded-md border bg-background px-3">{(businesses ?? []).map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</ThemedSelect></label><label className="grid gap-2 text-sm"><span className="font-medium">Location (manager/staff)</span><ThemedSelect name="locationId" className="h-10 rounded-md border bg-background px-3">{(locations ?? []).map((location) => <option key={location.id} value={location.id}>{(location.businesses as unknown as { name: string } | null)?.name} — {location.name}</option>)}</ThemedSelect></label><ThemedButton type="submit" className="w-full">Open Workspace</ThemedButton></form></ThemedCard></div></main>
}
