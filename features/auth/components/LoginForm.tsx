"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogIn } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { supabase } from "@/lib/supabase/client"

export function LoginForm({ next }: { next: string | null }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError("")
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.error) {
      setError(result.error.message)
      setPending(false)
      return
    }
    const query = next ? `?next=${encodeURIComponent(next)}` : ""
    router.replace(`/auth/continue${query}`)
    router.refresh()
  }

  return (
    <ThemedCard className="w-full max-w-md p-5 sm:p-6">
      <form onSubmit={submit} className="space-y-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Email</span>
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 rounded-md border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 rounded-md border bg-background px-3" />
        </label>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <ThemedButton type="submit" disabled={pending} className="w-full gap-2">
          <LogIn aria-hidden="true" className="size-4" />
          {pending ? "Signing in..." : "Sign In"}
        </ThemedButton>
        <div className="text-center"><Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">Forgot password?</Link></div>
      </form>
    </ThemedCard>
  )
}
