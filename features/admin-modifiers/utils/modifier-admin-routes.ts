export function getModifierAdminBaseHref(businessSlug?: string | null) {
  if (!businessSlug) return "/admin/modifiers"

  return `/businesses/${encodeURIComponent(businessSlug)}/admin/modifiers`
}

export function getModifierAdminHref(
  path = "",
  businessSlug?: string | null
) {
  const baseHref = getModifierAdminBaseHref(businessSlug)
  const normalizedPath = path.trim()

  if (!normalizedPath) return baseHref
  if (normalizedPath.startsWith("?")) return `${baseHref}${normalizedPath}`

  return `${baseHref}/${normalizedPath.replace(/^\/+/, "")}`
}

export function getModifierGroupHref({
  groupId,
  productId,
  businessSlug,
}: {
  groupId: string
  productId?: string | null
  businessSlug?: string | null
}) {
  const query = productId
    ? `?productId=${encodeURIComponent(productId)}`
    : ""

  return getModifierAdminHref(`${groupId}${query}`, businessSlug)
}

export function getModifierOptionGroupHref({
  groupId,
  optionGroupId,
  productId,
  businessSlug,
}: {
  groupId: string
  optionGroupId: string
  productId?: string | null
  businessSlug?: string | null
}) {
  const query = productId
    ? `?productId=${encodeURIComponent(productId)}`
    : ""

  return getModifierAdminHref(
    `${groupId}/subgroups/${optionGroupId}${query}`,
    businessSlug
  )
}
