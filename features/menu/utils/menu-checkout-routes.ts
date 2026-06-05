export function getMenuCheckoutHref(businessSlug?: string | null) {
  if (!businessSlug) return "/checkout"

  return `/businesses/${encodeURIComponent(businessSlug)}/checkout`
}
