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
  variants: ProductVariantPayload[]
}

export type ProductVariantPayload = {
  id: string | null
  name: string
  base_price: number
  is_default: boolean
  is_enabled: boolean
  sort_order: number
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

function parseOptionalVariantId(value: FormDataEntryValue | undefined) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function parseVariantSortOrder(value: FormDataEntryValue | undefined) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error("Variant sort order must be zero or greater.")
  }

  return parsedValue
}

function parseVariantEnabled(value: FormDataEntryValue | undefined) {
  return value !== "false"
}

function parseDefaultVariantIndex(
  value: FormDataEntryValue | null,
  variantCount: number
) {
  if (variantCount === 0) return null
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Choose one default variant.")
  }

  const parsedValue = Number(value)

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 0 ||
    parsedValue >= variantCount
  ) {
    throw new Error("Choose one default variant.")
  }

  return parsedValue
}

function buildVariantPayloads(formData: FormData): ProductVariantPayload[] {
  const variantNames = formData.getAll("variantNames")
  const variantIds = formData.getAll("variantIds")
  const variantBasePrices = formData.getAll("variantBasePrices")
  const variantSortOrders = formData.getAll("variantSortOrders")
  const variantIsEnabled = formData.getAll("variantIsEnabled")

  const variants = variantNames.map((nameValue, index) => ({
    id: parseOptionalVariantId(variantIds[index]),
    name: parseString(nameValue, "Variant name"),
    base_price: parsePrice(variantBasePrices[index] ?? null),
    is_default: false,
    is_enabled: parseVariantEnabled(variantIsEnabled[index]),
    sort_order: parseVariantSortOrder(variantSortOrders[index]),
  }))

  const defaultVariantIndex = parseDefaultVariantIndex(
    formData.get("defaultVariantIndex"),
    variants.length
  )

  return variants.map((variant, index) => ({
    ...variant,
    is_default: index === defaultVariantIndex,
  }))
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
  const variants = buildVariantPayloads(formData)

  return {
    product: {
      name,
      slug: createSlug(name),
      description,
      base_price: basePrice,
      builder_template: builderTemplate,
      has_variants: variants.length > 0,
      is_enabled: true,
    },
    menuGroupId,
    modifierGroupIds,
    variants,
  }
}
