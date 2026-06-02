export type ProductIncludedModifierGroupPayload =
  | {
      action: "save"
      productId: string
      modifierGroupId: string
      includedQuantity: number
      chargeForExtra: boolean
    }
  | {
      action: "clear"
      productId: string
      modifierGroupId: string
    }

function parseString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function parseIncludedQuantity(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return 0
  }

  const includedQuantity = Number(value)

  if (
    !Number.isFinite(includedQuantity) ||
    includedQuantity < 0 ||
    !Number.isInteger(includedQuantity)
  ) {
    throw new Error("Included selections must be a whole number zero or greater.")
  }

  return includedQuantity
}

export function buildProductIncludedModifierGroupPayload(
  formData: FormData
): ProductIncludedModifierGroupPayload {
  const productId = parseString(formData.get("productId"), "Product")
  const modifierGroupId = parseString(
    formData.get("modifierGroupId"),
    "Modifier group"
  )
  const includedQuantity = parseIncludedQuantity(
    formData.get("includedQuantity")
  )

  if (includedQuantity === 0 || formData.get("clearIncludedRule") === "true") {
    return {
      action: "clear",
      productId,
      modifierGroupId,
    }
  }

  return {
    action: "save",
    productId,
    modifierGroupId,
    includedQuantity,
    chargeForExtra: formData.get("chargeForExtra") === "true",
  }
}
