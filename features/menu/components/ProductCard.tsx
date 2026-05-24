"use client";

import { ImageIcon } from "lucide-react";
import { ThemedCard } from "@/components/themed/ThemedCard";
import { ThemedButton } from "@/components/themed/ThemedButton";

type ProductVariant = {
  id: string;
  name: string;
  base_price: number;
  is_default: boolean;
  is_enabled: boolean;
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
  variants?: ProductVariant[];
};

type ProductCardProps = {
  product: Product;
  onCustomize?: (productId: string) => void;
  isLoading?: boolean;
};

function getStartingPrice(product: Product) {
  if (product.has_variants && !product.variants?.length) {
    return null;
  }

  if (product.has_variants && product.variants?.length) {
    const sorted = [...product.variants].sort(
      (a, b) => a.base_price - b.base_price,
    );

    return sorted[0]?.base_price ?? null;
  }

  return product.base_price;
}

function getProductImage(product: Product) {
  const mediaAsset = Array.isArray(product.media_assets)
    ? product.media_assets[0]
    : product.media_assets;

  if (!mediaAsset || mediaAsset.is_archived || !mediaAsset.public_url) {
    return null;
  }

  return {
    src: mediaAsset.public_url,
    alt: mediaAsset.alt_text ?? mediaAsset.caption ?? product.name,
  };
}

export function ProductCard({
  product,
  onCustomize,
  isLoading = false,
}: ProductCardProps) {
  const startingPrice = getStartingPrice(product);
  const canCustomize =
    !product.has_variants || (product.variants?.length ?? 0) > 0;
  const image = getProductImage(product);

  function handleCustomize() {
    if (!canCustomize) return;

    onCustomize?.(product.id);
  }

  return (
    <ThemedCard className="flex h-full overflow-hidden p-0">
      <div className="flex h-full w-full flex-col">
        {image ? (
          <div className="border-b bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        ) : (
          <div aria-hidden="true" className="flex aspect-[4/3] items-center justify-center border-b bg-muted/40 text-muted-foreground">
            <ImageIcon className="size-8 opacity-60" />
          </div>
        )}

        <div className="flex flex-1 flex-col p-4">
          <div className="min-h-14">
            <h3 className="text-lg font-semibold leading-6 md:text-xl">
              {product.name}
            </h3>
          </div>

          {product.description ? (
            <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
              {product.description}
            </p>
          ) : (
            <div aria-hidden="true" className="mt-2 min-h-10" />
          )}

          <div className="mt-auto flex items-center justify-between gap-4 pt-5">
            <p className="font-semibold">
              {!canCustomize
                ? "Unavailable"
                : startingPrice !== null
                  ? `Starting at $${startingPrice.toFixed(2)}`
                  : "Price varies"}
            </p>

            <ThemedButton
              size="sm"
              disabled={isLoading || !canCustomize}
              onClick={handleCustomize}
            >
              {!canCustomize
                ? "Unavailable"
                : isLoading
                  ? "Loading..."
                  : "Customize"}
            </ThemedButton>
          </div>
        </div>
      </div>
    </ThemedCard>
  );
}
