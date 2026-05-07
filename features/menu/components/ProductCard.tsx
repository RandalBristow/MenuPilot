"use client";

import { ThemedCard } from "@/components/themed/ThemedCard";
import { ThemedButton } from "@/components/themed/ThemedButton";

type ProductVariant = {
  id: string;
  name: string;
  base_price: number;
  is_default: boolean;
  sort_order: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number | null;
  builder_template: string;
  has_variants: boolean;
  is_featured: boolean;
  product_variants?: ProductVariant[];
};

type ProductCardProps = {
  product: Product;
  onCustomize?: (productId: string) => void;
};

function getStartingPrice(product: Product) {
  if (product.has_variants && product.product_variants?.length) {
    const sorted = [...product.product_variants].sort(
      (a, b) => a.base_price - b.base_price,
    );

    return sorted[0]?.base_price ?? null;
  }

  return product.base_price;
}

export function ProductCard({ product, onCustomize }: ProductCardProps) {
  const startingPrice = getStartingPrice(product);

  return (
    <ThemedCard className="flex h-full flex-col justify-between p-5">
      <div>
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold">{product.name}</h3>

          {product.is_featured ? (
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Featured
            </span>
          ) : null}
        </div>

        {product.description ? (
          <p className="text-sm text-muted-foreground">{product.description}</p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="font-semibold">
          {startingPrice !== null
            ? `Starting at $${startingPrice.toFixed(2)}`
            : "Price varies"}
        </p>

        <ThemedButton
          size="sm"
          onClick={() => {
            console.log("Customize clicked:", product.id);
            onCustomize?.(product.id);
          }}
        >
          Customize
        </ThemedButton>
      </div>
    </ThemedCard>
  );
}
