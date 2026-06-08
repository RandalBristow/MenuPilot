import Link from "next/link"
import { Pencil, Plus, ThumbsDown, ThumbsUp } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { setSpecialEnabled } from "@/features/specials/actions/set-special-enabled"
import {
  formatDiscountSummary,
  getSpecialsAdminData,
  type SpecialAdminListItem,
} from "@/features/specials/queries/get-specials-admin-data"
import {
  getSpecialAdminHref,
  getSpecialDetailHref,
} from "@/features/specials/utils/special-admin-routes"
import { cn } from "@/lib/utils"

type SpecialsAdminPageProps = {
  businessSlug: string
}

const STATUS_LABELS: Record<SpecialAdminListItem["status"], string> = {
  disabled: "Disabled",
  scheduled: "Scheduled",
  active: "Active",
  expired: "Expired",
  inactive_now: "Inactive now",
}

function getStatusClassName(status: SpecialAdminListItem["status"]) {
  if (status === "active") return "border-success/30 bg-success/10 text-success"
  if (status === "expired") {
    return "border-muted-foreground/25 bg-muted text-muted-foreground"
  }
  if (status === "scheduled" || status === "inactive_now") {
    return "border-accent/40 bg-accent/20 text-accent-foreground"
  }

  return "border-muted-foreground/25 bg-muted text-muted-foreground"
}

function formatType(value: string) {
  if (value === "mix_and_match_fixed_unit_price") return "Mix & Match"
  if (value === "orderable_deal") return "Orderable deal"

  return value.replaceAll("_", " ")
}

function StatusPill({ status }: { status: SpecialAdminListItem["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium",
        getStatusClassName(status)
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function SpecialStatusForm({
  special,
  businessSlug,
}: {
  special: SpecialAdminListItem
  businessSlug: string
}) {
  const nextEnabled = !special.isEnabled
  const label = `${nextEnabled ? "Enable" : "Disable"} ${special.name}`

  return (
    <form action={setSpecialEnabled}>
      <input type="hidden" name="businessSlug" value={businessSlug} />
      <input type="hidden" name="specialId" value={special.id} />
      <input type="hidden" name="isEnabled" value={String(nextEnabled)} />
      <ThemedButton
        type="submit"
        variant="outline"
        size="icon"
        aria-label={label}
        className="size-9 bg-background text-foreground hover:bg-muted"
      >
        {special.isEnabled ? (
          <ThumbsUp aria-hidden="true" />
        ) : (
          <ThumbsDown aria-hidden="true" />
        )}
        <span className="sr-only">{label}</span>
      </ThemedButton>
    </form>
  )
}

function SpecialCard({
  special,
  businessSlug,
}: {
  special: SpecialAdminListItem
  businessSlug: string
}) {
  return (
    <ThemedCard
      className={cn(
        "gap-0 overflow-hidden p-0",
        special.isEnabled ? "" : "bg-muted/30 opacity-75"
      )}
    >
      <div className="px-3 pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <CompactRecordStatusIcon enabled={special.isEnabled} />
          <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5">
            {special.name}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <StatusPill status={special.status} />
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs capitalize text-muted-foreground">
            {formatType(special.specialType)}
          </span>
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
            {formatDiscountSummary(special)}
          </span>
          {special.specialType === "orderable_deal" ? (
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
              {special.components.length}{" "}
              {special.components.length === 1 ? "component" : "components"}
            </span>
          ) : null}
          {special.specialType === "mix_and_match_fixed_unit_price" &&
          special.mixMatchRule ? (
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
              {special.mixMatchRule.productIds.length} pool{" "}
              {special.mixMatchRule.productIds.length === 1
                ? "product"
                : "products"}
            </span>
          ) : null}
        </div>

        {special.description ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {special.description}
          </p>
        ) : null}

        <dl className="mt-2 grid gap-1 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
          <div>
            <dt className="font-medium text-foreground">Eligibility</dt>
            <dd>{special.eligibilitySummary}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Schedule</dt>
            <dd>{special.scheduleSummary}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-2">
        <SpecialStatusForm special={special} businessSlug={businessSlug} />

        <ThemedButton
          asChild
          variant="outline"
          size="icon"
          aria-label={`Edit ${special.name}`}
          className="size-9 bg-background text-foreground hover:bg-muted"
        >
          <Link href={getSpecialDetailHref(special.id, businessSlug)}>
            <Pencil aria-hidden="true" />
            <span className="sr-only">Edit {special.name}</span>
          </Link>
        </ThemedButton>
      </div>
    </ThemedCard>
  )
}

export async function SpecialsAdminPage({ businessSlug }: SpecialsAdminPageProps) {
  const data = await getSpecialsAdminData(businessSlug)

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <ThemedPageHeader
          title="Specials"
          description={`Create and reuse discounts for ${data.business.name}.`}
          className="shrink-0 border-b pb-3"
        />

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {data.specials.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">Create your first special</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Specials can discount products, product groups, or the whole cart.
              </p>
            </ThemedCard>
          ) : (
            data.specials.map((special) => (
              <SpecialCard
                key={special.id}
                special={special}
                businessSlug={businessSlug}
              />
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end gap-2">
            <AdminBackButton
              fallbackHref={`/businesses/${encodeURIComponent(
                businessSlug
              )}/admin`}
              label="Back to business admin"
            />
            <ThemedButton
              asChild
              size="icon"
              aria-label="New Special"
              className="size-10 rounded-md p-0 shadow-sm"
            >
              <Link href={getSpecialAdminHref("new", businessSlug)}>
                <Plus aria-hidden="true" />
                <span className="sr-only">New Special</span>
              </Link>
            </ThemedButton>
          </div>
        </div>
      </div>
    </main>
  )
}
