"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { supabase } from "@/lib/supabase/client"

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) return setError("Password must be at least 8 characters.")
    if (password !== confirmPassword) return setError("Passwords do not match.")
    setPending(true)
    const result = await supabase.auth.updateUser({ password })
    if (result.error) { setError(result.error.message); setPending(false); return }
    router.replace("/auth/continue")
    router.refresh()
  }
  return <ThemedCard className="w-full max-w-md p-5"><form onSubmit={submit} className="space-y-4"><label className="grid gap-2 text-sm"><span className="font-medium">New password</span><input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 rounded-md border bg-background px-3" /></label><label className="grid gap-2 text-sm"><span className="font-medium">Confirm password</span><input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-10 rounded-md border bg-background px-3" /></label>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<ThemedButton type="submit" disabled={pending} className="w-full">{pending ? "Saving..." : "Set Password"}</ThemedButton></form></ThemedCard>
}
