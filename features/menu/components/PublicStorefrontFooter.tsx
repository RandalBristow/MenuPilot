import Link from "next/link"

export function PublicStorefrontFooter() {
  return (
    <footer className="border-t bg-card/60 px-4 py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-7xl justify-end">
        <Link href="/platform" className="hover:text-foreground hover:underline">
          Platform Admin
        </Link>
      </div>
    </footer>
  )
}
