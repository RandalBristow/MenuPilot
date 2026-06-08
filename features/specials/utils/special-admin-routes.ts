export function getSpecialAdminBaseHref(businessSlug: string) {
  return `/businesses/${encodeURIComponent(businessSlug)}/admin/specials`
}

export function getSpecialAdminHref(path: string, businessSlug: string) {
  const baseHref = getSpecialAdminBaseHref(businessSlug)
  const normalizedPath = path.trim()

  if (!normalizedPath) return baseHref

  return `${baseHref}/${normalizedPath.replace(/^\/+/, "")}`
}

export function getSpecialDetailHref(specialId: string, businessSlug: string) {
  return getSpecialAdminHref(specialId, businessSlug)
}
