import {
  isActiveBuilderTemplate,
  type ActiveBuilderTemplate,
} from "../../product-configurator/utils/builder-templates"

export type ProductCreationPayload = {
  product: {
    name: string
    slug: string
    description: string | null
    base_price: number
    builder_template: ActiveBuilderTemplate
    has_variants: boolean
    is_enabled: true
    image_media_id: string | null
  }
  menuGroupId: string
  modifierGroupIds: string[]
}

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function parsePrice(value: FormDataEntryValue | null) {
  const rawValue = parseString(value, "Base price")
  const parsedValue = Number(rawValue)

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error("Base price must be zero or greater.")
  }

  return parsedValue
}

function parseBuilderTemplate(
  value: FormDataEntryValue | null
): ActiveBuilderTemplate {
  if (isActiveBuilderTemplate(value)) {
    return value
  }

  throw new Error("Builder template is not supported yet.")
}

function parseStringList(values: FormDataEntryValue[]) {
  return values.filter((value): value is string => typeof value === "string")
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true"
}

export function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function buildProductPayload(
  formData: FormData
): ProductCreationPayload {
  const name = parseString(formData.get("name"), "Product name")
  const description = parseOptionalString(formData.get("description"))
  const basePrice = parsePrice(formData.get("basePrice"))
  const builderTemplate = parseBuilderTemplate(formData.get("builderTemplate"))
  const hasVariants = parseBoolean(formData.get("hasVariants"))
  const menuGroupId = parseString(formData.get("menuGroupId"), "Category")
  const imageMediaId = parseOptionalString(formData.get("imageMediaId"))
  const modifierGroupIds = parseStringList(formData.getAll("modifierGroupIds"))

  return {
    product: {
      name,
      slug: createSlug(name),
      description,
      base_price: basePrice,
      builder_template: builderTemplate,
      has_variants: hasVariants,
      is_enabled: true,
      image_media_id: imageMediaId,
    },
    menuGroupId,
    modifierGroupIds,
  }
}
