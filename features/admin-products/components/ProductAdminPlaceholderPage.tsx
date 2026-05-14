import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ThemedPageShell } from "@/components/themed/ThemedPageShell"

type ProductAdminPlaceholderPageProps = {
  title: string
  description: string
}

export function ProductAdminPlaceholderPage({
  title,
  description,
}: ProductAdminPlaceholderPageProps) {
  return (
    <ThemedPageShell maxWidth="lg">
      <ThemedPageHeader title={title} description={description} />

      <ThemedCard className="gap-1 p-4">
        <h2 className="m-0 text-base font-semibold">Coming soon</h2>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          This product management area will be built in a focused pass.
        </p>
      </ThemedCard>
    </ThemedPageShell>
  )
}
