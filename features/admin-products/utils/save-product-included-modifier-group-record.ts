import type { ProductIncludedModifierGroupPayload } from "@/features/admin-products/utils/build-product-included-modifier-group-payload"

export type IncludedModifierGroupRecord = {
  id: string
  product_id: string
  modifier_group_id: string
}

export type IncludedModifierGroupStore = {
  findExisting: (input: {
    businessId: string
    productId: string
    modifierGroupId: string
  }) => Promise<IncludedModifierGroupRecord | null>
  insert: (input: {
    businessId: string
    productId: string
    modifierGroupId: string
    includedQuantity: number
    chargeForExtra: boolean
  }) => Promise<void>
  update: (input: {
    id: string
    businessId: string
    includedQuantity: number
    chargeForExtra: boolean
  }) => Promise<void>
  clear: (input: {
    businessId: string
    productId: string
    modifierGroupId: string
  }) => Promise<void>
}

export async function saveProductIncludedModifierGroupRecord({
  businessId,
  payload,
  store,
}: {
  businessId: string
  payload: ProductIncludedModifierGroupPayload
  store: IncludedModifierGroupStore
}) {
  if (payload.action === "clear") {
    await store.clear({
      businessId,
      productId: payload.productId,
      modifierGroupId: payload.modifierGroupId,
    })
    return
  }

  const existing = await store.findExisting({
    businessId,
    productId: payload.productId,
    modifierGroupId: payload.modifierGroupId,
  })

  if (existing) {
    await store.update({
      id: existing.id,
      businessId,
      includedQuantity: payload.includedQuantity,
      chargeForExtra: payload.chargeForExtra,
    })
    return
  }

  await store.insert({
    businessId,
    productId: payload.productId,
    modifierGroupId: payload.modifierGroupId,
    includedQuantity: payload.includedQuantity,
    chargeForExtra: payload.chargeForExtra,
  })
}
