import { createClient } from "@supabase/supabase-js"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the local environment.")
  process.exit(1)
}

if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
  console.error("Run this command in an interactive terminal so the password can be entered securely.")
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function promptForEmail() {
  const readline = createInterface({ input: stdin, output: stdout })
  const email = (await readline.question("Supabase Auth email: ")).trim().toLowerCase()
  readline.close()
  return email
}

function promptHidden(label) {
  return new Promise((resolve, reject) => {
    let value = ""
    stdout.write(label)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding("utf8")

    const finish = () => {
      stdin.off("data", onData)
      stdin.setRawMode(false)
      stdin.pause()
      stdout.write("\n")
    }

    const onData = (character) => {
      if (character === "\u0003") {
        finish()
        reject(new Error("Cancelled."))
        return
      }
      if (character === "\r" || character === "\n") {
        finish()
        resolve(value)
        return
      }
      if (character === "\u0008" || character === "\u007f") {
        if (value.length > 0) {
          value = value.slice(0, -1)
          stdout.write("\b \b")
        }
        return
      }
      if (character >= " ") {
        value += character
        stdout.write("*")
      }
    }

    stdin.on("data", onData)
  })
}

async function findUserByEmail(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return user
    if (data.users.length < 1000) return null
  }
}

try {
  const email = await promptForEmail()
  if (!email) throw new Error("Email is required.")

  const password = await promptHidden("New password: ")
  if (password.length < 8) throw new Error("Password must be at least 8 characters.")

  const confirmation = await promptHidden("Confirm password: ")
  if (password !== confirmation) throw new Error("Passwords do not match.")

  const user = await findUserByEmail(email)
  if (!user) throw new Error(`No Supabase Auth user exists for ${email}.`)

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })
  if (error) throw error

  console.log(`Password updated for ${email}. You can now sign in through /login.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not update the password.")
  process.exitCode = 1
}
