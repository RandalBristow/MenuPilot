import { supabase } from "@/lib/supabase/client"

export default async function HomePage() {
  const { data, error } = await supabase.from("test").select("*")

  console.log("DATA:", data)
  console.log("ERROR:", error)

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <h1 className="text-3xl">MenuPilot</h1>
    </main>
  )
}