"use client"

import { useState } from "react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { supabase } from "@/lib/supabase/client"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const redirectTo = `${window.location.origin}/auth/recovery`
    const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setMessage(result.error ? result.error.message : "If that account exists, a password reset email has been sent.")
    setPending(false)
  }
  return <ThemedCard className="w-full max-w-md p-5"><form onSubmit={submit} className="space-y-4"><label className="grid gap-2 text-sm"><span className="font-medium">Email</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 rounded-md border bg-background px-3" /></label>{message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}<ThemedButton type="submit" disabled={pending} className="w-full">{pending ? "Sending..." : "Send Reset Link"}</ThemedButton></form></ThemedCard>
}
