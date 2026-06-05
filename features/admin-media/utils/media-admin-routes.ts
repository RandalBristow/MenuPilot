export function getMediaAdminHref(businessSlug?: string | null) {
  if (!businessSlug) return "/admin/media"

  return `/businesses/${encodeURIComponent(businessSlug)}/admin/media`
}
