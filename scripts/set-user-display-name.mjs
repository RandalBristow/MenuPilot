import { createClient } from "@supabase/supabase-js"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the local environment.")
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return user
    if (data.users.length < 1000) return null
  }
}

const readline = createInterface({ input: stdin, output: stdout })

try {
  const email = (await readline.question("Supabase Auth email: ")).trim().toLowerCase()
  const firstName = (await readline.question("First name: ")).trim()
  const lastName = (await readline.question("Last name: ")).trim()
  const displayName = [firstName, lastName].filter(Boolean).join(" ")

  if (!email) throw new Error("Email is required.")
  if (!displayName) throw new Error("Enter a first or last name.")

  const user = await findUserByEmail(email)
  if (!user) throw new Error(`No Supabase Auth user exists for ${email}.`)

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      first_name: firstName || null,
      last_name: lastName || null,
      display_name: displayName,
    },
  })
  if (error) throw error

  console.log(`Display name updated to ${displayName} for ${email}.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not update the display name.")
  process.exitCode = 1
} finally {
  readline.close()
}
