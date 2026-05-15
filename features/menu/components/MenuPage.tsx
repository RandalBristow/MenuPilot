"use client";

import { useState } from "react";
import { CategorySection } from "./CategorySection";
import { MobileCategoryNav } from "./MobileCategoryNav";
import { MobileMenuDrawer } from "./MobileMenuDrawer";

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
  menu: Menu;
  onCustomize?: (productId: string) => void;
  loadingProductId?: string | null;
  headerAction?: React.ReactNode;
};

export function MenuPage({
  businessName,
  menu,
  onCustomize,
  loadingProductId,
  headerAction,
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
                MenuPilot Demo
              </p>
              <h1 className="truncate text-lg font-bold md:hidden">Pronto</h1>
              <h1 className="hidden text-2xl font-bold md:block">
                {businessName}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <nav className="hidden gap-4 md:flex">
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
          {selectedParentGroup ? (
            <CategorySection
              parentGroup={selectedParentGroup}
              childGroups={selectedChildGroups}
              onCustomize={onCustomize}
              loadingProductId={loadingProductId}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No categories found.</p>
          )}
        </div>
      </div>
    </main>
  );
}
