export const MEDIA_STORAGE_BUCKET = "menu-media"
export const MAX_MEDIA_IMAGE_BYTES = 5 * 1024 * 1024

const IMAGE_EXTENSIONS_BY_TYPE: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export type ImageFileLike = {
  name: string
  size: number
  type: string
}

export function isValidImageContentType(contentType: string | null) {
  return contentType?.toLowerCase().split(";")[0].trim().startsWith("image/") ??
    false
}

export function validateImageFile(file: ImageFileLike) {
  if (!isValidImageContentType(file.type)) {
    return "Media assets must be image files."
  }

  if (file.size <= 0) {
    return "Choose an image file to upload."
  }

  if (file.size > MAX_MEDIA_IMAGE_BYTES) {
    return "Image files must be 5 MB or smaller."
  }

  return null
}

export function validateImportUrl(value: string) {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    return "Enter a valid image URL."
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Image URL must start with http or https."
  }

  return null
}

export function validateMediaName(value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    return "Name is required."
  }

  return null
}

export function parseMediaTags(value: string | null | undefined) {
  if (!value) return []

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function sanitizeFileName(fileName: string) {
  const normalized = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized || "media-image"
}

function getExtensionFromContentType(contentType: string) {
  return IMAGE_EXTENSIONS_BY_TYPE[contentType.toLowerCase().split(";")[0].trim()]
}

function ensureExtension(fileName: string, contentType: string) {
  if (/\.[a-z0-9]+$/i.test(fileName)) return fileName

  const extension = getExtensionFromContentType(contentType)

  return extension ? `${fileName}.${extension}` : fileName
}

export function buildMediaStoragePath({
  businessId,
  folder,
  fileName,
  contentType,
  uniqueId,
}: {
  businessId: string
  folder?: string | null
  fileName: string
  contentType: string
  uniqueId: string
}) {
  const folderSegment = folder ? sanitizeFileName(folder) : "library"
  const safeFileName = ensureExtension(sanitizeFileName(fileName), contentType)

  return `${businessId}/${folderSegment}/${uniqueId}-${safeFileName}`
}
