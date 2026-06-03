export type MoveModifierOptionPayload = {
  optionId: string
  modifierGroupId: string
  destinationOptionGroupId: string | null
}

export type MoveModifierOptionRecord = {
  id: string
  modifier_group_id: string
  modifier_option_group_id: string | null
}

export type MoveModifierOptionGroupRecord = {
  id: string
  modifier_group_id: string
}

export type MoveModifierOptionStore = {
  findOption: (
    payload: MoveModifierOptionPayload
  ) => Promise<MoveModifierOptionRecord | null>
  findDestinationOptionGroup: (input: {
    modifierGroupId: string
    destinationOptionGroupId: string
  }) => Promise<MoveModifierOptionGroupRecord | null>
  updateOptionGroup: (input: {
    optionId: string
    modifierGroupId: string
    destinationOptionGroupId: string | null
  }) => Promise<void>
}

export type MoveModifierOptionResult =
  | {
      status: "moved"
      message: string
      optionId: string
      destinationOptionGroupId: string | null
    }
  | {
      status: "blocked"
      message: string
    }

export async function moveModifierOption({
  payload,
  store,
}: {
  payload: MoveModifierOptionPayload
  store: MoveModifierOptionStore
}): Promise<MoveModifierOptionResult> {
  const option = await store.findOption(payload)

  if (!option) {
    return {
      status: "blocked",
      message: "Selected modifier option could not be found.",
    }
  }

  if (option.modifier_group_id !== payload.modifierGroupId) {
    return {
      status: "blocked",
      message: "Selected modifier option does not belong to this Modifier Group.",
    }
  }

  if (payload.destinationOptionGroupId) {
    const destination = await store.findDestinationOptionGroup({
      modifierGroupId: payload.modifierGroupId,
      destinationOptionGroupId: payload.destinationOptionGroupId,
    })

    if (!destination) {
      return {
        status: "blocked",
        message:
          "Modifier options can only be moved to option groups inside the same Modifier Group.",
      }
    }
  }

  await store.updateOptionGroup({
    optionId: option.id,
    modifierGroupId: payload.modifierGroupId,
    destinationOptionGroupId: payload.destinationOptionGroupId,
  })

  return {
    status: "moved",
    message: "Modifier option moved.",
    optionId: option.id,
    destinationOptionGroupId: payload.destinationOptionGroupId,
  }
}

