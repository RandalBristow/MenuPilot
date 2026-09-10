import { redirect } from "next/navigation"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { UpdatePasswordForm } from "@/features/auth/components/UpdatePasswordForm"
import { getWorkforceIdentity } from "@/features/auth/server/identity"

export default async function UpdatePasswordPage() {
  if (!(await getWorkforceIdentity())) redirect("/login")
  return <main className="min-h-screen bg-background px-4 py-12"><div className="mx-auto flex max-w-md flex-col items-center gap-6"><div className="space-y-2 text-center"><ThemedHeading>Set Your Password</ThemedHeading><p className="text-sm text-muted-foreground">Choose the password you will use for MenuPilot workforce access.</p></div><UpdatePasswordForm /></div></main>
}
