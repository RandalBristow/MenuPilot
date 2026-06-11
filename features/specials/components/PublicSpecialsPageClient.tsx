"use client"

import Link from "next/link"
import { useState } from "react"
import { CartHeaderButton } from "@/features/cart/components/CartHeaderButton"
import { PublicStorefrontFooter } from "@/features/menu/components/PublicStorefrontFooter"
import { getMenuCheckoutHref } from "@/features/menu/utils/menu-checkout-routes"
import { DealBuilder } from "@/features/specials/components/DealBuilder"
import { MixAndMatchBuilder } from "@/features/specials/components/MixAndMatchBuilder"
import { PublicSpecialsSection } from "@/features/specials/components/PublicSpecialsSection"
import type { PublicSpecial } from "@/features/specials/types/public-special"

type PublicSpecialsPageClientProps = {
  businessName: string
  businessSlug: string
  businessStatus: string | null
  activeSpecials: PublicSpecial[]
}

export function PublicSpecialsPageClient({
  businessName,
  businessSlug,
  businessStatus,
  activeSpecials,
}: PublicSpecialsPageClientProps) {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [selectedDealType, setSelectedDealType] = useState<
    PublicSpecial["specialType"] | null
  >(null)
  const [isDealOpen, setIsDealOpen] = useState(false)
  const isSetupPreview = businessStatus === "setup"
  const menuHref = `/businesses/${encodeURIComponent(businessSlug)}/menu`
  const checkoutHref = getMenuCheckoutHref(businessSlug)

  function handleBuildDeal(specialId: string) {
    const special = activeSpecials.find((item) => item.id === specialId)

    setSelectedDealId(specialId)
    setSelectedDealType(special?.specialType ?? null)
    setIsDealOpen(true)
  }

  return (
    <>
      <main className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:gap-4 md:py-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground md:size-10">
                P
              </div>

              <div className="min-w-0">
                <p className="hidden text-sm text-muted-foreground md:block">
                  MenuPilot
                </p>
                <h1 className="truncate text-lg font-bold md:hidden">
                  Specials & Deals
                </h1>
                <h1 className="hidden text-2xl font-bold md:block">
                  {businessName}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <nav className="hidden gap-4 md:flex">
                <Link
                  href={menuHref}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Menu
                </Link>
                <Link
                  href={`/businesses/${encodeURIComponent(businessSlug)}/specials`}
                  className="text-sm font-medium text-foreground"
                >
                  Specials
                </Link>
              </nav>

              {isSetupPreview ? null : (
                <CartHeaderButton checkoutHref={checkoutHref} />
              )}
            </div>
          </div>
        </header>

        {isSetupPreview ? (
          <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            <div className="mx-auto max-w-7xl">
              Preview mode: this business is in setup and is not accepting
              public orders.
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
          <div className="space-y-2">
            <Link
              href={menuHref}
              className="inline-flex text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Back to menu
            </Link>
            <h2 className="text-3xl font-bold">Specials & Deals</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Browse active discounts and buildable deals for {businessName}.
            </p>
          </div>

          <PublicSpecialsSection
            specials={activeSpecials}
            title="Available Specials"
            description="Buildable deals can be added here. Passive discounts are confirmed at checkout."
            showEmptyState
            onBuildDeal={handleBuildDeal}
            loadingDealId={selectedDealId && isDealOpen ? selectedDealId : null}
            orderingActionsDisabled={isSetupPreview}
          />
        </div>

        <PublicStorefrontFooter />
      </main>

      {selectedDealType === "mix_and_match_fixed_unit_price" ? (
        <MixAndMatchBuilder
          open={isDealOpen}
          onOpenChange={setIsDealOpen}
          businessSlug={businessSlug}
          specialId={selectedDealId}
        />
      ) : (
        <DealBuilder
          open={isDealOpen}
          onOpenChange={setIsDealOpen}
          businessSlug={businessSlug}
          specialId={selectedDealId}
        />
      )}
    </>
  )
}
