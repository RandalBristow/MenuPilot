export type BuilderTemplate = "pizza" | "standard"

export type ProductCreationPayload = {
  product: {
    name: string
    slug: string
    description: string | null
    base_price: number
    builder_template: BuilderTemplate
    has_variants: boolean
    is_enabled: true
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
): BuilderTemplate {
  if (value === "pizza" || value === "standard") {
    return value
  }

  throw new Error("Builder template must be pizza or standard.")
}

function parseStringList(values: FormDataEntryValue[]) {
  return values.filter((value): value is string => typeof value === "string")
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
  const menuGroupId = parseString(formData.get("menuGroupId"), "Category")
  const modifierGroupIds = parseStringList(formData.getAll("modifierGroupIds"))

  return {
    product: {
      name,
      slug: createSlug(name),
      description,
      base_price: basePrice,
      builder_template: builderTemplate,
      has_variants: true,
      is_enabled: true,
    },
    menuGroupId,
    modifierGroupIds,
  }
}
