"use client";

import Link from "next/link";
import { useState } from "react";
import { CategorySection } from "./CategorySection";
import { MobileCategoryNav } from "./MobileCategoryNav";
import { MobileMenuDrawer } from "./MobileMenuDrawer";
import type { PublicSpecial } from "@/features/specials/types/public-special";
import { PublicSpecialsSection } from "@/features/specials/components/PublicSpecialsSection";
import { PublicStorefrontFooter } from "@/features/menu/components/PublicStorefrontFooter";

type MenuGroup = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_group_id: string | null;
  sort_order: number;
  display_style: string;
  product_groups: {
    id: string;
    sort_order: number;
    products: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      base_price: number | null;
      builder_template: string;
      has_variants: boolean;
      is_featured: boolean;
      is_enabled: boolean;
      image_media_id?: string | null;
      media_assets?:
        | {
            id: string;
            public_url: string | null;
            alt_text: string | null;
            caption: string | null;
            is_archived: boolean;
          }
        | {
            id: string;
            public_url: string | null;
            alt_text: string | null;
            caption: string | null;
            is_archived: boolean;
          }[]
        | null;
      variants: {
        id: string;
        name: string;
        base_price: number;
        is_default: boolean;
        is_enabled: boolean;
        sort_order: number;
      }[];
    };
  }[];
};

type Menu = {
  id: string;
  name: string;
  description: string | null;
  menu_groups: MenuGroup[];
};

type MenuPageProps = {
  businessName: string;
  businessSlug?: string | null;
  menu: Menu;
  activeSpecials?: PublicSpecial[];
  onCustomize?: (productId: string) => void;
  onBuildDeal?: (specialId: string) => void;
  loadingProductId?: string | null;
  loadingDealId?: string | null;
  headerAction?: React.ReactNode;
  previewMessage?: string | null;
  orderingActionsDisabled?: boolean;
};

export function MenuPage({
  businessName,
  businessSlug,
  menu,
  activeSpecials = [],
  onCustomize,
  onBuildDeal,
  loadingProductId,
  loadingDealId,
  headerAction,
  previewMessage,
  orderingActionsDisabled = false,
}: MenuPageProps) {
  const groups = [...(menu.menu_groups ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const parentGroups = groups.filter((group) => !group.parent_group_id);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    parentGroups[0]?.id ?? null,
  );

  const selectedParentGroup =
    parentGroups.find((group) => group.id === selectedCategoryId) ??
    parentGroups[0] ??
    null;

  const selectedChildGroups = selectedParentGroup
    ? groups.filter((group) => group.parent_group_id === selectedParentGroup.id)
    : [];
  const specialsHref = businessSlug
    ? `/businesses/${encodeURIComponent(businessSlug)}/specials`
    : "/menu";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:gap-4 md:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <MobileMenuDrawer />

            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground md:size-10">
              P
            </div>

            <div className="min-w-0">
              <p className="hidden text-sm text-muted-foreground md:block">
                MenuPilot
              </p>
              <h1 className="truncate text-lg font-bold md:hidden">
                {businessName}
              </h1>
              <h1 className="hidden text-2xl font-bold md:block">
                {businessName}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <nav className="hidden gap-4 md:flex">
              <Link
                href={specialsHref}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Specials
              </Link>
              {parentGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(group.id)}
                  className={
                    selectedParentGroup?.id === group.id
                      ? "text-sm font-medium text-foreground"
                      : "text-sm font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  {group.name}
                </button>
              ))}
            </nav>

            {headerAction}
          </div>
        </div>

        <MobileCategoryNav
          categories={parentGroups}
          selectedCategoryId={selectedParentGroup?.id ?? null}
          onSelectCategory={setSelectedCategoryId}
        />
      </header>

      {previewMessage ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <div className="mx-auto max-w-7xl">{previewMessage}</div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-xl border bg-card p-4">
            <p className="mb-3 text-sm font-semibold">Categories</p>

            <div className="space-y-2">
              {parentGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(group.id)}
                  className={
                    selectedParentGroup?.id === group.id
                      ? "block w-full rounded-lg bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground"
                      : "block w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-14">
          <PublicSpecialsSection
            specials={activeSpecials}
            onBuildDeal={onBuildDeal}
            loadingDealId={loadingDealId}
            orderingActionsDisabled={orderingActionsDisabled}
          />

          {activeSpecials.length > 0 && businessSlug ? (
            <Link
              href={specialsHref}
              className="inline-flex text-sm font-medium text-primary hover:underline"
            >
              View all specials
            </Link>
          ) : null}

          {selectedParentGroup ? (
            <CategorySection
              parentGroup={selectedParentGroup}
              childGroups={selectedChildGroups}
              activeSpecials={activeSpecials}
              onCustomize={onCustomize}
              loadingProductId={loadingProductId}
              orderingActionsDisabled={orderingActionsDisabled}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No categories found.</p>
          )}
        </div>
      </div>

      <PublicStorefrontFooter />
    </main>
  );
}
