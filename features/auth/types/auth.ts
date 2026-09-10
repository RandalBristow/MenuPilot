export type WorkforceRole = "platform" | "owner" | "admin" | "manager" | "staff"

export type DevIdentity = {
  role: WorkforceRole
  businessId?: string
  businessSlug?: string
  locationId?: string
  locationSlug?: string
}

export type WorkforceIdentity = {
  userId: string | null
  email: string | null
  isDevelopmentIdentity: boolean
  development?: DevIdentity
}
