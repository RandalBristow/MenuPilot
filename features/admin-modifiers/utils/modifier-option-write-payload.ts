export type ModifierOptionWritePayloadInput = {
  modifierOptionGroupId: string
  name: string
  priceDelta: number
  sortOrder: number
}

export function buildModifierOptionWritePayload({
  modifierOptionGroupId,
  name,
  priceDelta,
  sortOrder,
}: ModifierOptionWritePayloadInput) {
  return {
    modifier_option_group_id: modifierOptionGroupId,
    name,
    price_delta: priceDelta,
    sort_order: sortOrder,
  }
}
