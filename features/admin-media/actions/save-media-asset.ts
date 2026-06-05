"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  buildMediaStoragePath,
  isValidImageContentType,
  MAX_MEDIA_IMAGE_BYTES,
  MEDIA_STORAGE_BUCKET,
  parseMediaTags,
  validateImageFile,
  validateImportUrl,
  validateMediaName,
} from "@/features/admin-media/utils/media-upload"
import {
  getMediaAdminActionBusinessSlug,
  getMediaAdminActionHref,
  resolveMediaAdminActionContext,
} from "@/features/admin-media/utils/media-admin-action-context"
import {
  getProductAdminHref,
  getProductListHref,
} from "@/features/admin-products/utils/product-admin-routes"

type SaveMediaAssetResult =
  | {
      ok: true
    }
  | {
      ok: false
      error: string
    }

type UploadedMedia = {
  storage_bucket: string
  storage_path: string
  public_url: string
  file_name: string
  mime_type: string
  file_size: number
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function getFile(formData: FormData) {
  const value = formData.get("imageFile")

  if (value instanceof File && value.size > 0) {
    return value
  }

  return null
}

function getFileNameFromUrl(url: string, contentType: string) {
  const pathname = new URL(url).pathname
  const fileName = pathname.split("/").filter(Boolean).at(-1)

  if (fileName) return fileName

  if (contentType.includes("png")) return "imported-image.png"
  if (contentType.includes("webp")) return "imported-image.webp"
  if (contentType.includes("gif")) return "imported-image.gif"

  return "imported-image.jpg"
}

async function assertMediaAsset(businessId: string, mediaAssetId: string) {
  const { data, error } = await supabaseAdmin
    .from("media_assets")
    .select("id")
    .eq("business_id", businessId)
    .eq("id", mediaAssetId)
    .single()

  if (error || !data) {
    throw new Error("Selected media asset could not be found.")
  }
}

async function uploadMediaObject({
  businessId,
  folder,
  fileName,
  contentType,
  body,
  fileSize,
}: {
  businessId: string
  folder: string | null
  fileName: string
  contentType: string
  body: Blob | ArrayBuffer
  fileSize: number
}): Promise<UploadedMedia> {
  const storagePath = buildMediaStoragePath({
    businessId,
    folder,
    fileName,
    contentType,
    uniqueId: crypto.randomUUID(),
  })

  const { error } = await supabaseAdmin.storage
    .from(MEDIA_STORAGE_BUCKET)
    .upload(storagePath, body, {
      contentType,
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabaseAdmin.storage
    .from(MEDIA_STORAGE_BUCKET)
    .getPublicUrl(storagePath)

  return {
    storage_bucket: MEDIA_STORAGE_BUCKET,
    storage_path: storagePath,
    public_url: data.publicUrl,
    file_name: fileName,
    mime_type: contentType,
    file_size: fileSize,
  }
}

async function uploadDeviceFile({
  businessId,
  folder,
  file,
}: {
  businessId: string
  folder: string | null
  file: File
}) {
  const validationError = validateImageFile(file)

  if (validationError) return { ok: false as const, error: validationError }

  try {
    return {
      ok: true as const,
      media: await uploadMediaObject({
        businessId,
        folder,
        fileName: file.name,
        contentType: file.type,
        body: file,
        fileSize: file.size,
      }),
    }
  } catch {
    return {
      ok: false as const,
      error:
        "Could not upload that image. Please check the media bucket and try again.",
    }
  }
}

async function importUrl({
  businessId,
  folder,
  url,
}: {
  businessId: string
  folder: string | null
  url: string
}) {
  const validationError = validateImportUrl(url)

  if (validationError) return { ok: false as const, error: validationError }

  let response: Response

  try {
    response = await fetch(url)
  } catch {
    return {
      ok: false as const,
      error:
        "Could not import that image. Please check the URL or upload the file instead.",
    }
  }

  if (!response.ok) {
    return {
      ok: false as const,
      error:
        "Could not import that image. Please check the URL or upload the file instead.",
    }
  }

  const contentType = response.headers.get("content-type")

  if (!isValidImageContentType(contentType)) {
    return { ok: false as const, error: "Image URL must point to an image file." }
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0)

  if (contentLength > MAX_MEDIA_IMAGE_BYTES) {
    return { ok: false as const, error: "Image files must be 5 MB or smaller." }
  }

  const body = await response.arrayBuffer()

  if (body.byteLength > MAX_MEDIA_IMAGE_BYTES) {
    return { ok: false as const, error: "Image files must be 5 MB or smaller." }
  }

  const safeContentType = (contentType ?? "").split(";")[0].trim().toLowerCase()

  try {
    return {
      ok: true as const,
      media: await uploadMediaObject({
        businessId,
        folder,
        fileName: getFileNameFromUrl(url, safeContentType),
        contentType: safeContentType,
        body,
        fileSize: body.byteLength,
      }),
    }
  } catch {
    return {
      ok: false as const,
      error:
        "Could not upload the imported image. Please check the media bucket and try again.",
    }
  }
}

export async function saveMediaAsset(
  formData: FormData
): Promise<SaveMediaAssetResult> {
  const context = await resolveMediaAdminActionContext(formData)
  const businessId = context.businessId
  const mediaAssetId = parseOptionalString(formData.get("mediaAssetId"))
  const sourceType = parseOptionalString(formData.get("sourceType"))
  const name = parseOptionalString(formData.get("name"))
  const nameError = validateMediaName(name)

  if (nameError) return { ok: false, error: nameError }

  const mediaName = name ?? ""
  const altText = parseOptionalString(formData.get("altText")) ?? mediaName
  const tags = parseMediaTags(parseOptionalString(formData.get("tags")))
  const storageFolder = null

  let uploadedMedia: UploadedMedia | null = null

  if (sourceType === "upload") {
    const file = getFile(formData)

    if (!file) return { ok: false, error: "Choose an image file to upload." }

    const uploadResult = await uploadDeviceFile({
      businessId,
      folder: storageFolder,
      file,
    })

    if (!uploadResult.ok) return uploadResult

    uploadedMedia = uploadResult.media
  } else if (sourceType === "url") {
    const importSourceUrl = parseOptionalString(formData.get("importUrl"))

    if (!importSourceUrl) {
      return { ok: false, error: "Enter an image URL to import." }
    }

    const importResult = await importUrl({
      businessId,
      folder: storageFolder,
      url: importSourceUrl,
    })

    if (!importResult.ok) return importResult

    uploadedMedia = importResult.media
  } else if (!mediaAssetId) {
    return { ok: false, error: "Choose an upload source." }
  }

  const metadata = {
    alt_text: altText,
    tags,
    file_name: mediaName,
    ...(uploadedMedia
      ? {
          ...uploadedMedia,
          file_name: mediaName,
        }
      : {}),
  }

  if (mediaAssetId) {
    await assertMediaAsset(businessId, mediaAssetId)

    const { error } = await supabaseAdmin
      .from("media_assets")
      .update(metadata)
      .eq("business_id", businessId)
      .eq("id", mediaAssetId)

    if (error) {
      throw new Error(`Could not update media asset: ${error.message}`)
    }
  } else {
    if (!uploadedMedia) {
      return { ok: false, error: "Choose an upload source." }
    }

    const { error } = await supabaseAdmin.from("media_assets").insert({
      business_id: businessId,
      is_archived: false,
      ...metadata,
    })

    if (error) {
      throw new Error(`Could not create media asset: ${error.message}`)
    }
  }

  const businessSlug = getMediaAdminActionBusinessSlug(context)

  revalidatePath(getMediaAdminActionHref(context))
  revalidatePath(getProductAdminHref("", businessSlug))
  revalidatePath(getProductListHref(businessSlug))
  revalidatePath("/menu")

  return { ok: true }
}
