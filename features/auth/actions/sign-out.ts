"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DEV_IDENTITY_COOKIE } from "@/features/auth/server/identity"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  ;(await cookies()).delete(DEV_IDENTITY_COOKIE)
  redirect("/login")
}
