export function getMediaAdminHref(businessSlug?: string | null) {
  if (!businessSlug) return "/platform/businesses"

  return `/businesses/${encodeURIComponent(businessSlug)}/admin/media`
}
