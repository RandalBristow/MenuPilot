export function getProductAdminBaseHref(businessSlug?: string | null) {
  if (!businessSlug) return "/admin/products"

  return `/businesses/${encodeURIComponent(businessSlug)}/admin/products`
}

export function getProductAdminHref(
  path = "",
  businessSlug?: string | null
) {
  const baseHref = getProductAdminBaseHref(businessSlug)
  const normalizedPath = path.trim()

  if (!normalizedPath) return baseHref
  if (normalizedPath.startsWith("?")) return `${baseHref}${normalizedPath}`

  return `${baseHref}/${normalizedPath.replace(/^\/+/, "")}`
}

export function getProductDetailHref(
  productId: string,
  businessSlug?: string | null
) {
  return getProductAdminHref(productId, businessSlug)
}

export function getProductListHref(businessSlug?: string | null) {
  return getProductAdminHref("list", businessSlug)
}

export function getProductVariantAssignmentsHref(
  productId?: string | null,
  businessSlug?: string | null
) {
  const query = productId
    ? `?productId=${encodeURIComponent(productId)}`
    : ""

  return getProductAdminHref(`variant-assignments${query}`, businessSlug)
}

export function getProductModifierGroupsHref(
  productId?: string | null,
  businessSlug?: string | null
) {
  const query = productId
    ? `?productId=${encodeURIComponent(productId)}`
    : ""

  return getProductAdminHref(`modifier-groups${query}`, businessSlug)
}

export function getProductModifierAvailabilityHref({
  modifierGroupId,
  productId,
  businessSlug,
}: {
  modifierGroupId: string
  productId?: string | null
  businessSlug?: string | null
}) {
  const query = productId
    ? `?productId=${encodeURIComponent(productId)}`
    : ""

  return getProductAdminHref(
    `modifier-groups/${modifierGroupId}/availability${query}`,
    businessSlug
  )
}

export function getVariantGroupDetailHref({
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

  return getProductAdminHref(`variant-groups/${groupId}${query}`, businessSlug)
}
