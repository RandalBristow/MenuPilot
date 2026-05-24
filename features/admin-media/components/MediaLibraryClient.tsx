"use client"

import { useState } from "react"
import { ImageIcon, Plus } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { MediaAssetFormSheet } from "@/features/admin-media/components/MediaAssetFormSheet"
import type { MediaAsset } from "@/features/admin-media/queries/get-media-assets"

type MediaLibraryClientProps = {
  businessName: string
  assets: MediaAsset[]
}

function getAssetTitle(asset: MediaAsset) {
  if (asset.alt_text) return asset.alt_text
  if (asset.caption) return asset.caption
  if (asset.file_name) return asset.file_name

  return "Untitled media"
}

export function MediaLibraryClient({
  businessName,
  assets,
}: MediaLibraryClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredAssets = normalizedSearchQuery
    ? assets.filter((asset) =>
        [
          getAssetTitle(asset),
          asset.file_name,
          asset.alt_text,
          asset.caption,
          ...asset.tags,
        ]
          .filter(Boolean)
          .some((value) =>
            value?.toLowerCase().includes(normalizedSearchQuery)
          )
      )
    : assets

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title="Media Library"
            description={`Manage reusable media assets for ${businessName}.`}
          />
          <label className="sr-only" htmlFor="media-library-search">
            Search media assets
          </label>
          <input
            id="media-library-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search images"
            className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-24">
          {assets.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No media yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add public image URLs to use on menu products.
              </p>
            </ThemedCard>
          ) : filteredAssets.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No matching images</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another image name or tag.
              </p>
            </ThemedCard>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredAssets.map((asset) => (
                <ThemedCard
                  key={asset.id}
                  className="gap-0 overflow-hidden py-0 transition hover:border-primary/40 hover:bg-muted/20"
                >
                  <button
                    type="button"
                    className="flex w-full flex-col text-left"
                    onClick={() => setActiveAsset(asset)}
                  >
                    <span className="flex min-h-8 items-center border-b px-2 py-1.5">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {getAssetTitle(asset)}
                      </span>
                    </span>

                    <span className="flex aspect-[4/3] items-center justify-center bg-muted/30">
                      {asset.public_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.public_url}
                          alt={asset.alt_text ?? getAssetTitle(asset)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          aria-hidden="true"
                          className="size-6 text-muted-foreground"
                        />
                      )}
                    </span>

                    <span className="flex min-h-8 flex-wrap items-center gap-1 border-t px-2 py-1.5 text-xs text-muted-foreground">
                      {asset.tags.length > 0 ? (
                        asset.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="max-w-full truncate rounded-full bg-muted px-1.5 py-1 leading-none"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span>No tags</span>
                      )}
                      {asset.tags.length > 3 ? (
                        <span className="rounded-full bg-muted px-1.5 py-1 leading-none">
                          +{asset.tags.length - 3}
                        </span>
                      ) : null}
                      {asset.is_archived ? (
                        <span className="rounded-full bg-muted px-1.5 py-1 leading-none">
                          Archived
                        </span>
                      ) : null}
                    </span>
                  </button>
                </ThemedCard>
              ))}
            </div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl justify-end gap-2">
            <AdminBackButton
              fallbackHref="/admin"
              label="Back to admin dashboard"
            />
            <ThemedButton
              type="button"
              size="icon"
              aria-label="New media asset"
              className="size-10 rounded-md p-0 shadow-sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus aria-hidden="true" />
              <span className="sr-only">New media asset</span>
            </ThemedButton>
          </div>
        </div>
      </div>

      <MediaAssetFormSheet
        key={createOpen ? "create-open" : "create-closed"}
        open={createOpen}
        onOpenChange={setCreateOpen}
        asset={null}
      />
      <MediaAssetFormSheet
        key={activeAsset?.id ?? "edit-closed"}
        open={Boolean(activeAsset)}
        onOpenChange={(open) => {
          if (!open) setActiveAsset(null)
        }}
        asset={activeAsset}
      />
    </main>
  )
}
