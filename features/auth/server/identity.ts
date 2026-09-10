import { cookies, headers } from "next/headers"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { DevIdentity, WorkforceIdentity } from "@/features/auth/types/auth"

export const DEV_IDENTITY_COOKIE = "menupilot_dev_identity"

export async function isDevelopmentAccessEnabled() {
  if (process.env.NODE_ENV !== "development" || process.env.DEV_AUTH_BYPASS !== "true") return false
  const host = (await headers()).get("host")?.split(":")[0]
  return host === "localhost" || host === "127.0.0.1"
}

function parseDevelopmentIdentity(value?: string): DevIdentity | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as DevIdentity
    if (!["platform", "owner", "admin", "manager", "staff"].includes(parsed.role)) return null
    return parsed
  } catch {
    return null
  }
}

export async function getWorkforceIdentity(): Promise<WorkforceIdentity | null> {
  if (await isDevelopmentAccessEnabled()) {
    const development = parseDevelopmentIdentity((await cookies()).get(DEV_IDENTITY_COOKIE)?.value)
    if (development) return { userId: null, email: null, isDevelopmentIdentity: true, development }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { userId: user.id, email: user.email ?? null, isDevelopmentIdentity: false }
}

export function isPlatformOwnerEmail(email: string | null) {
  if (!email) return false
  const allowed = (process.env.PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.toLowerCase())
}
