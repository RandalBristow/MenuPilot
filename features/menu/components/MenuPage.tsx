import { CategorySection } from "./CategorySection";

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
      product_variants: {
        id: string;
        name: string;
        base_price: number;
        is_default: boolean;
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">MenuPilot Demo</p>
            <h1 className="text-2xl font-bold">{businessName}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <nav className="hidden gap-4 md:flex">
              {parentGroups.map((group) => (
                <a
                  key={group.id}
                  href={`#${group.slug}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {group.name}
                </a>
              ))}
            </nav>

            {headerAction}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-4 md:hidden">
          {parentGroups.map((group) => (
            <a
              key={group.id}
              href={`#${group.slug}`}
              className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium"
            >
              {group.name}
            </a>
          ))}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-xl border bg-card p-4">
            <p className="mb-3 text-sm font-semibold">Categories</p>

            <div className="space-y-2">
              {parentGroups.map((group) => (
                <a
                  key={group.id}
                  href={`#${group.slug}`}
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {group.name}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-14">
          {parentGroups.map((parentGroup) => {
            const childGroups = groups.filter(
              (group) => group.parent_group_id === parentGroup.id,
            );

            return (
              <CategorySection
                key={parentGroup.id}
                parentGroup={parentGroup}
                childGroups={childGroups}
                onCustomize={onCustomize}
                loadingProductId={loadingProductId}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
