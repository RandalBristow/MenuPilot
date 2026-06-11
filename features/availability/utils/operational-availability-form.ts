export function parseOperational86Flag(value: FormDataEntryValue | null) {
  if (value === "true") return true
  if (value === "false") return false

  throw new Error("Temporary availability value is invalid.")
}

export function parseOperationalReason(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null

  const reason = value.trim()

  return reason.length > 0 ? reason : null
}

export function parseOperationalExpiresAt(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null

  const expiresAt = value.trim()
  if (expiresAt.length === 0) return null

  const parsed = new Date(expiresAt)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Expiration date/time is invalid.")
  }

  return parsed.toISOString()
}
