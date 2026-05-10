import { ProductCard } from "./ProductCard";

type ProductGroup = {
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
};

type MenuGroup = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_group_id: string | null;
  sort_order: number;
  display_style: string;
  product_groups: ProductGroup[];
};

type CategorySectionProps = {
  parentGroup: MenuGroup;
  childGroups: MenuGroup[];
  onCustomize?: (productId: string) => void;
  loadingProductId?: string | null;
};

export function CategorySection({
  parentGroup,
  childGroups,
  onCustomize,
  loadingProductId,
}: CategorySectionProps) {
  return (
    <section id={parentGroup.slug} className="scroll-mt-28 md:scroll-mt-28">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">{parentGroup.name}</h2>

        {parentGroup.description ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {parentGroup.description}
          </p>
        ) : null}
      </div>

      <div className="space-y-10">
        {childGroups.map((childGroup) => {
          const productGroups = [...(childGroup.product_groups ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order,
          );

          return (
            <div key={childGroup.id}>
              <div className="mb-4">
                <h3 className="text-2xl font-semibold">{childGroup.name}</h3>

                {childGroup.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {childGroup.description}
                  </p>
                ) : null}
              </div>

              {productGroups.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {productGroups.map((productGroup) => {
                    const product = Array.isArray(productGroup.products)
                      ? productGroup.products[0]
                      : productGroup.products;

                    if (!product) return null;

                    return (
                      <ProductCard
                        key={productGroup.id}
                        product={product}
                        onCustomize={onCustomize}
                        isLoading={loadingProductId === product.id}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No items available.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
