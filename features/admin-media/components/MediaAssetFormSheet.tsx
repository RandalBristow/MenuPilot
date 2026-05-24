"use client"

import { useEffect, useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import { saveMediaAsset } from "@/features/admin-media/actions/save-media-asset"
import {
  MAX_MEDIA_IMAGE_BYTES,
  validateImageFile,
  validateImportUrl,
} from "@/features/admin-media/utils/media-upload"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type { MediaAsset } from "@/features/admin-media/queries/get-media-assets"

type MediaAssetFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: MediaAsset | null
}

type SourceType = "keep" | "upload" | "url"

function formatMaxSize() {
  return `${MAX_MEDIA_IMAGE_BYTES / 1024 / 1024} MB`
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function MediaAssetFormSheet({
  open,
  onOpenChange,
  asset,
}: MediaAssetFormSheetProps) {
  const isEditMode = asset !== null
  const [sourceType, setSourceType] = useState<SourceType>(
    isEditMode ? "keep" : "upload"
  )
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null)
  const [importUrl, setImportUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    }
  }, [filePreviewUrl])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    setError(null)

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)

    if (!file) {
      setFilePreviewUrl(null)
      setSelectedFileSize(null)
      return
    }

    setSelectedFileSize(file.size)

    const validationError = validateImageFile(file)

    if (validationError) {
      setError(validationError)
      setFilePreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null)
      return
    }

    setFilePreviewUrl(URL.createObjectURL(file))
  }

  function handleImportUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value
    setImportUrl(nextValue)

    if (!nextValue.trim()) {
      setError(null)
      return
    }

    setError(validateImportUrl(nextValue))
  }

  function handleSourceTypeChange(nextSourceType: SourceType) {
    setSourceType(nextSourceType)
    setError(null)
    setSelectedFileSize(null)
  }

  async function handleSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      try {
        const result = await saveMediaAsset(formData)

        if (!result.ok) {
          setError(result.error)
          return
        }

        onOpenChange(false)
      } catch {
        setError("Could not save this media asset. Please try again.")
      }
    })
  }

  const previewUrl =
    sourceType === "upload"
      ? filePreviewUrl
      : sourceType === "keep"
        ? asset?.public_url ?? null
        : null
  const isSelectedFileTooLarge =
    selectedFileSize !== null && selectedFileSize > MAX_MEDIA_IMAGE_BYTES

  return (
    <ThemedSheet open={open} onOpenChange={onOpenChange}>
      <ThemedSheetContent
        side="bottom"
        showCloseButton={false}
        className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
      >
        <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
          <ThemedSheetTitle>
            {isEditMode ? "Edit Media" : "New Media"}
          </ThemedSheetTitle>
          <ThemedSheetDescription>
            {isEditMode
              ? "Update the name and tags or replace the stored image."
              : "Upload an image or import an image URL into the library."}
          </ThemedSheetDescription>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pt-2">
            {isEditMode ? (
              <ThemedButton
                type="button"
                size="sm"
                onClick={() => handleSourceTypeChange("keep")}
                className={
                  sourceType === "keep"
                    ? "shrink-0"
                    : "shrink-0 bg-muted text-foreground hover:bg-muted/80"
                }
              >
                Keep current
              </ThemedButton>
            ) : null}
            <ThemedButton
              type="button"
              size="sm"
              onClick={() => handleSourceTypeChange("upload")}
              className={
                sourceType === "upload"
                  ? "shrink-0"
                  : "shrink-0 bg-muted text-foreground hover:bg-muted/80"
              }
            >
              Upload
            </ThemedButton>
            <ThemedButton
              type="button"
              size="sm"
              onClick={() => handleSourceTypeChange("url")}
              className={
                sourceType === "url"
                  ? "shrink-0"
                  : "shrink-0 bg-muted text-foreground hover:bg-muted/80"
              }
            >
              Import URL
            </ThemedButton>
          </div>
        </ThemedSheetHeader>

        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className={PRODUCT_ADMIN_PANEL_BODY_CLASS}>
            {asset ? (
              <input type="hidden" name="mediaAssetId" value={asset.id} />
            ) : null}
            <input type="hidden" name="sourceType" value={sourceType} />

            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4">
              {sourceType === "upload" ? (
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Image file</span>
                  <input
                    name="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-secondary-foreground"
                  />
                  <span className="text-xs text-muted-foreground">
                    Images only, {formatMaxSize()} max.
                  </span>
                </label>
              ) : null}

              {sourceType === "url" ? (
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Image URL</span>
                  <input
                    name="importUrl"
                    type="url"
                    value={importUrl}
                    onChange={handleImportUrlChange}
                    placeholder="https://example.com/image.jpg"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">
                    The image will be copied into Supabase Storage.
                  </span>
                </label>
              ) : null}

              {sourceType === "url" && importUrl && !error ? (
                <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  The image preview will appear after the URL is imported into
                  the Media Library.
                </p>
              ) : null}

              {previewUrl ? (
                <div className="grid gap-2">
                  <span className="text-sm font-medium">Preview</span>
                  <div className="overflow-hidden rounded-md border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Media preview"
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                  {sourceType === "upload" && selectedFileSize !== null ? (
                    <p
                      className={`text-right text-xs font-medium ${
                        isSelectedFileTooLarge
                          ? "text-destructive"
                          : "text-success"
                      }`}
                    >
                      {formatFileSize(selectedFileSize)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <label className="grid gap-2">
                <span className="text-sm font-medium">
                  Image name <span className="text-destructive">*</span>
                </span>
                <input
                  name="name"
                  required
                  defaultValue={asset?.file_name ?? ""}
                  placeholder="Deluxe Pizza"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Alt text</span>
                <input
                  name="altText"
                  defaultValue={asset?.alt_text ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
                <span className="text-xs text-muted-foreground">
                  Leave blank to use the media name.
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Tags</span>
                <input
                  name="tags"
                  placeholder="pizza, toppings"
                  defaultValue={asset?.tags.join(", ") ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>
            </div>
          </div>

          <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Close</span>
            </ThemedButton>
            <ThemedButton
              type="submit"
              size="icon"
              aria-label={isEditMode ? "Save media asset" : "Create media asset"}
              className="size-10"
              disabled={isPending || Boolean(error)}
            >
              <Check aria-hidden="true" />
              <span className="sr-only">
                {isPending
                  ? "Saving media asset"
                  : isEditMode
                    ? "Save media asset"
                    : "Create media asset"}
              </span>
            </ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}
