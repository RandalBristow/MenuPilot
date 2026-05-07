import { getMenuByBusinessSlug } from "@/features/menu/queries/get-menu"

export default async function HomePage() {
  const { business, menus } = await getMenuByBusinessSlug("pronto-demo")

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <h1 className="text-5xl font-bold text-red-500">{business.name}</h1>

      <pre className="mt-8 overflow-auto rounded-lg bg-zinc-900 p-4 text-sm">
        {JSON.stringify(menus, null, 2)}
      </pre>
    </main>
  )
}