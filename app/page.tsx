import Link from "next/link"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"

const featuredCategories = [
  {
    name: "Pizza",
    description: "Build your own or choose a specialty favorite.",
    href: "/menu#pizza",
  },
  {
    name: "Wings",
    description: "Traditional and boneless wings with sauces.",
    href: "/menu#wings",
  },
  {
    name: "Subs",
    description: "Hot and cold subs made fresh.",
    href: "/menu#subs",
  },
  {
    name: "Drinks",
    description: "Soda, coffee, and more.",
    href: "/menu#drinks",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold">
            Pronto Demo
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium">
              Home
            </Link>
            <Link href="/menu" className="text-sm font-medium">
              Menu
            </Link>
            <Link href="#location" className="text-sm font-medium">
              Location
            </Link>
            <ThemedButton asChild size="sm">
              <Link href="/menu">Order Online</Link>
            </ThemedButton>
          </nav>

          <ThemedButton asChild size="sm" className="md:hidden">
            <Link href="/menu">Order</Link>
          </ThemedButton>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-red-950 via-zinc-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%)]" />

        <div className="relative mx-auto grid min-h-140 max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
              Pizza • Wings • Subs • Carryout
            </p>

            <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
              Hot food, fast pickup, easy ordering.
            </h1>

            <p className="mt-6 text-lg leading-8 text-zinc-200">
              Order pizza, wings, subs, salads, drinks, and more from your local
              favorite. Built as a MenuPilot demo storefront.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ThemedButton asChild size="lg">
                <Link href="/menu">Order Online</Link>
              </ThemedButton>

              <ThemedButton asChild size="lg" variant="secondary">
                <Link href="/menu">View Menu</Link>
              </ThemedButton>
            </div>
          </div>

          <ThemedCard className="border-white/15 bg-white/10 p-6 text-white shadow-2xl backdrop-blur">
            <div className="aspect-square rounded-3xl bg-linear-to-br from-red-500 via-orange-400 to-yellow-300 p-6">
              <div className="flex h-full items-center justify-center rounded-2xl border-4 border-white/40 bg-black/20 text-center">
                <div>
                  <p className="text-7xl">🍕</p>
                  <p className="mt-4 text-2xl font-bold">Fresh from the oven</p>
                  <p className="mt-2 text-sm text-white/80">
                    Hero carousel will use media library images later.
                  </p>
                </div>
              </div>
            </div>
          </ThemedCard>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Order favorites</p>
            <h2 className="mt-2 text-3xl font-bold">Featured Categories</h2>
          </div>

          <Link href="/menu" className="hidden text-sm font-semibold md:block">
            View full menu →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCategories.map((category) => (
            <Link key={category.name} href={category.href}>
              <ThemedCard className="h-full p-5 transition hover:-translate-y-1 hover:shadow-lg">
                <h3 className="text-xl font-semibold">{category.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {category.description}
                </p>
              </ThemedCard>
            </Link>
          ))}
        </div>
      </section>

      <section id="location" className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary">Visit us</p>
            <h2 className="mt-2 text-3xl font-bold">Main Street Location</h2>
            <p className="mt-4 text-muted-foreground">
              123 Main Street, Mansfield, OH 44902
            </p>
            <p className="mt-2 text-muted-foreground">555-555-1212</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border bg-background px-3 py-1 text-sm">
                Pickup available
              </span>
              <span className="rounded-full border bg-background px-3 py-1 text-sm">
                Delivery available
              </span>
              <span className="rounded-full border bg-background px-3 py-1 text-sm">
                Online ordering
              </span>
            </div>
          </div>

          <ThemedCard className="p-6">
            <h3 className="text-xl font-semibold">Today’s Hours</h3>
            <p className="mt-3 text-muted-foreground">
              Hours are seeded in the database. We’ll wire this section to live
              location hours soon.
            </p>

            <div className="mt-6">
              <ThemedButton asChild className="w-full sm:w-auto">
                <Link href="/menu">Start an Order</Link>
              </ThemedButton>
            </div>
          </ThemedCard>
        </div>
      </section>

      <footer className="px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Pronto Demo. Powered by MenuPilot.</p>
          <p>Website, menu, ordering, and operations in one place.</p>
        </div>
      </footer>
    </main>
  )
}