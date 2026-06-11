"use client"

import { ThemedButton } from "@/components/themed/ThemedButton"
import type { PublicSpecial } from "@/features/specials/types/public-special"
import {
  getPublicSpecialCallout,
  getPublicSpecialEligibilitySummary,
  getPublicSpecialTypeLabel,
  isPublicBuildableSpecial,
} from "@/features/specials/utils/public-special-display"

type PublicSpecialsSectionProps = {
  specials: PublicSpecial[]
  title?: string
  description?: string
  emptyMessage?: string
  showEmptyState?: boolean
  onBuildDeal?: (specialId: string) => void
  loadingDealId?: string | null
  orderingActionsDisabled?: boolean
}

export function PublicSpecialsSection({
  specials,
  title = "Current Specials",
  description = "Discounts are confirmed at checkout.",
  emptyMessage = "No specials or deals are available right now.",
  showEmptyState = false,
  onBuildDeal,
  loadingDealId,
  orderingActionsDisabled = false,
}: PublicSpecialsSectionProps) {
  if (specials.length === 0 && !showEmptyState) return null

  return (
    <section aria-labelledby="public-specials" className="space-y-3">
      <div>
        <h2 id="public-specials" className="text-2xl font-bold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {specials.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {specials.map((special) => {
            const isBuildable = isPublicBuildableSpecial(special)
            const isMixAndMatch =
              special.specialType === "mix_and_match_fixed_unit_price"

            return (
              <div
                key={special.id}
                className="flex min-h-full flex-col rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold leading-6">{special.name}</h3>
                  <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    {getPublicSpecialTypeLabel(special)}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  {special.customerDescription ??
                    getPublicSpecialEligibilitySummary(special)}
                </p>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {getPublicSpecialCallout(special)}
                </p>

                {isBuildable ? (
                  <ThemedButton
                    type="button"
                    size="sm"
                    className="mt-4 w-fit"
                    disabled={
                      orderingActionsDisabled || loadingDealId === special.id
                    }
                    onClick={() => onBuildDeal?.(special.id)}
                  >
                    {orderingActionsDisabled
                      ? "Preview only"
                      : loadingDealId === special.id
                        ? "Loading..."
                        : isMixAndMatch
                          ? "Build Mix & Match"
                          : "Build Deal"}
                  </ThemedButton>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
