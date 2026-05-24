"use client"

import { useMemo, useState } from "react"
import { ImageIcon, X } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type { MediaAssetOption } from "@/features/admin-products/components/ProductForm"

type ProductImageSelectorProps = {
  mediaAssets: MediaAssetOption[]
  initialImageMediaId: string | null
  productName: string
}

function getMediaAssetTitle(asset: MediaAssetOption) {
  return asset.alt_text ?? asset.caption ?? asset.file_name ?? "Untitled image"
}

export function ProductImageSelector({
  mediaAssets,
  initialImageMediaId,
  productName,
}: ProductImageSelectorProps) {
  const [selectedImageMediaId, setSelectedImageMediaId] = useState(
    initialImageMediaId ?? ""
  )
  const [selectorOpen, setSelectorOpen] = useState(false)
  const selectedAsset = useMemo(
    () =>
      mediaAssets.find((asset) => asset.id === selectedImageMediaId) ?? null,
    [mediaAssets, selectedImageMediaId]
  )

  return (
    <section className="grid gap-2">
      <input type="hidden" name="imageMediaId" value={selectedImageMediaId} />
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Product Image</h2>
        <ThemedButton
          type="button"
          variant="outline"
          className="h-9 bg-background px-3 text-foreground hover:bg-muted"
          onClick={() => setSelectorOpen(true)}
        >
          Select Image
        </ThemedButton>
      </div>

      <ThemedCard className="gap-0 overflow-hidden py-0">
        {selectedAsset ? (
          <div className="grid grid-cols-[5rem_1fr]">
            <div className="flex min-h-20 items-center justify-center border-r bg-muted/30">
              {selectedAsset.public_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedAsset.public_url}
                  alt={selectedAsset.alt_text ?? productName}
                  className="h-full min-h-20 w-full object-cover"
                />
              ) : (
                <ImageIcon
                  aria-hidden="true"
                  className="size-6 text-muted-foreground"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-col justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {getMediaAssetTitle(selectedAsset)}
                </p>
                {selectedAsset.file_name ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {selectedAsset.file_name}
                  </p>
                ) : null}
              </div>
              <div className="flex justify-end">
                <ThemedButton
                  type="button"
                  variant="outline"
                  className="h-8 bg-background px-3 text-foreground hover:bg-muted"
                  onClick={() => setSelectedImageMediaId("")}
                >
                  Clear
                </ThemedButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-3">
            <p className="text-sm text-muted-foreground">No image selected</p>
          </div>
        )}
      </ThemedCard>

      <ThemedSheet open={selectorOpen} onOpenChange={setSelectorOpen}>
        <ThemedSheetContent
          side="bottom"
          showCloseButton={false}
          className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        >
          <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
            <ThemedSheetTitle>Select Product Image</ThemedSheetTitle>
            <ThemedSheetDescription>
              Choose an image from the Media Library.
            </ThemedSheetDescription>
          </ThemedSheetHeader>

          <div className={PRODUCT_ADMIN_PANEL_BODY_CLASS}>
            {mediaAssets.length === 0 ? (
              <ThemedCard className="p-5 text-center">
                <p className="font-semibold">No images available</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add images in the Media Library before selecting one here.
                </p>
              </ThemedCard>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {mediaAssets.map((asset) => {
                  const selected = asset.id === selectedImageMediaId

                  return (
                    <ThemedCard
                      key={asset.id}
                      className={
                        selected
                          ? "gap-0 overflow-hidden border-primary py-0"
                          : "gap-0 overflow-hidden py-0"
                      }
                    >
                      <button
                        type="button"
                        className="flex w-full flex-col text-left"
                        onClick={() => {
                          setSelectedImageMediaId(asset.id)
                          setSelectorOpen(false)
                        }}
                      >
                        <span className="flex min-h-8 items-center border-b px-2 py-1.5">
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {getMediaAssetTitle(asset)}
                          </span>
                        </span>
                        <span className="flex aspect-[4/3] items-center justify-center bg-muted/30">
                          {asset.public_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={asset.public_url}
                              alt={asset.alt_text ?? productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon
                              aria-hidden="true"
                              className="size-6 text-muted-foreground"
                            />
                          )}
                        </span>
                      </button>
                    </ThemedCard>
                  )
                })}
              </div>
            )}
          </div>

          <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close image selector"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() => setSelectorOpen(false)}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Close image selector</span>
            </ThemedButton>
          </div>
        </ThemedSheetContent>
      </ThemedSheet>
    </section>
  )
}
